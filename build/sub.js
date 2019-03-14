"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const moment = __importStar(require("moment"));
const iconv = __importStar(require("iconv-lite"));
// 主账户密钥
let accountSecretKey = '';
// 子账户密钥
let subAccountSecretKey = '';
class Ticket {
    /**
   * 用密钥解密thor，并生成对应ticket
   *
   * @static
   * @param {string} thor thor
   * @param {string} secretKey 密钥
   * @returns {ITicket}
   * @memberof Ticket
   */
    static parse(thor, secretKey) {
        const iv = '00000000000000000000000000000000';
        // thor解密成buffer
        const thorBuffer = Ticket.decrypt(Buffer.from(thor, 'hex'), Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
        // 解出ticket
        return Ticket.parseFromBuffer(thorBuffer);
    }
    static decrypt(ciphertext, secretkey, iv) {
        const cipher = crypto.createDecipheriv('AES-192-CBC', secretkey, iv);
        const prefix = cipher.update(ciphertext);
        return Buffer.concat([prefix, cipher.final()]);
    }
    static parseDate(buffer) {
        const v = buffer.readUInt32LE(4) * 4294967296 + buffer.readUInt32LE(0);
        const v2 = (v - 116444736000000000) / 10000000.0;
        return moment.unix(v2).format();
    }
    static parseFromBuffer(ticketData) {
        const ticket = {
            version: -1,
            userName: '',
            isPersistent: false,
            expires: '',
            issueDate: '',
            userData: ''
        };
        // ticketData偏移量
        let pos = 8;
        // 版本
        {
            ticket.version = ticketData[pos];
            pos += 1;
        }
        // 用户名
        {
            let userNameEndPos = pos;
            // FIXME: 遗留问题：限制用户名最大长度，不然会读到ticketData边界
            for (let i = pos; i < ticketData.length - 1; i += 2) {
                if (ticketData[i] === 0 && ticketData[i + 1] === 0) {
                    userNameEndPos = i;
                    break;
                }
            }
            const userNameData = ticketData.slice(pos, userNameEndPos);
            ticket.userName = iconv
                .decode(Buffer.from(userNameData), 'utf16le')
                .toString();
            pos = userNameEndPos + 2;
        }
        // 签发时间
        {
            ticket.issueDate = Ticket.parseDate(ticketData.slice(pos, pos + 8));
            pos += 8;
        }
        // 是否持久化
        {
            ticket.isPersistent = ticketData[pos] !== 0;
            pos += 1;
        }
        // 过期时间
        {
            ticket.expires = Ticket.parseDate(ticketData.slice(pos, pos + 8));
            pos += 8;
        }
        // 用户数据
        {
            let userDataEndPos = pos;
            for (let i = pos; i < ticketData.length - 1; i += 2) {
                if (ticketData[i] === 0 && ticketData[i + 1] === 0) {
                    userDataEndPos = i;
                    break;
                }
            }
            const userData = ticketData.slice(pos, userDataEndPos);
            ticket.userData = iconv
                .decode(Buffer.from(userData), 'utf16le')
                .toString();
            pos = userDataEndPos + 2;
        }
        return ticket;
    }
}
exports.Ticket = Ticket;
/**
 * 设置主账户密钥
 *
 * @export
 * @param {string} key 密钥
 */
function setAccountSecretKey(key) {
    accountSecretKey = key;
}
exports.setAccountSecretKey = setAccountSecretKey;
/**
 * 设置子账户密钥
 *
 * @export
 * @param {string} key 密钥
 */
function setSubAccountSecretKey(key) {
    subAccountSecretKey = key;
}
exports.setSubAccountSecretKey = setSubAccountSecretKey;
/**
 * 获取主账户密钥
 *
 * @export
 * @returns 主账户密钥
 */
function getAccountKey() {
    return accountSecretKey;
}
exports.getAccountKey = getAccountKey;
/**
 * 获取子账户密钥
 *
 * @export
 * @returns {string} 子账户密钥
 */
function getSubAccountKey() {
    return subAccountSecretKey;
}
exports.getSubAccountKey = getSubAccountKey;
/**
 * 解析主账户thor
 *
 * @param {string} thor
 * @param {any} cookies Cookie对象
 * @returns {IThorResult} 解析结果
 */
function resolveAccountThor(thor, cookies) {
    if (!thor) {
        throw new Error('Argument thor is falsy value.');
    }
    if (!accountSecretKey) {
        throw new Error('Argument accountSecretKey is falsy value');
    }
    const ticket = Ticket.parse(thor, accountSecretKey);
    const pin = ticket.userName;
    const adminPinKey = encodeURI(pin).concat('adminPin');
    const adminPin = adminPinKey in cookies ? cookies[adminPinKey] : '';
    const isLogin = adminPin !== '' || pin !== '';
    return {
        isLogin,
        pin,
        adminPin,
        isNewSubAccount: false
    };
}
/**
 * 解析子账户thor
 *
 * @param {string} sthor
 * @returns {IThorResult} 解析结果
 */
function resolveSubAccountThor(sthor) {
    if (!sthor) {
        throw new Error('Argument thor is falsy value.');
    }
    if (!subAccountSecretKey) {
        throw new Error('Argument accountSecretKey is falsy value');
    }
    const ticket = Ticket.parse(sthor, subAccountSecretKey);
    const userNameArray = ticket.userName.split(' @ ');
    const isLogin = userNameArray.length === 2 &&
        userNameArray[0] !== '' &&
        userNameArray[1] !== '';
    if (!isLogin) {
        return {
            isLogin,
            adminPin: '',
            pin: '',
            isNewSubAccount: false
        };
    }
    return {
        isLogin,
        adminPin: userNameArray[1],
        pin: userNameArray[0],
        isNewSubAccount: true
    };
}
/**
 * 解析rthor
 *
 * @param {string} rthor
 * @param {string} subAccountSecretKey 角色解 thor 用到子账号的 key
 * @returns {any} 解析结果
 */
function resolveRoleThor(rthor, subAccountSecretKey) {
    if (!rthor) {
        throw new Error('Argument rthor is falsy value.');
    }
    if (!subAccountSecretKey) {
        throw new Error('Argument subAccountSecretKey is falsy value');
    }
    const ticket = Ticket.parse(rthor, subAccountSecretKey);
    let ticketIsExpires = !(moment.default(ticket.expires).diff(moment.now()) > 0);
    return {
        isLogin: ticket.userName !== '' && !ticketIsExpires,
        pin: ticket.userName,
        adminPin: '',
        isNewSubAccount: false,
        userData: ticket.userData,
        isExpires: ticketIsExpires
    };
}
exports.resolveRoleThor = resolveRoleThor;
/**
 * 解析角色
 *
 * @param {string} rthor
 * @param {string} credentials
 * @returns {IThorResult} 解析结果
 */
function resolveRoleAccountThor(credentials) {
    if (!credentials) {
        throw new Error('Argument cookies of rthor or credentials is falsy value.');
    }
    if (!subAccountSecretKey) {
        throw new Error('Argument accountSecretKey is falsy value');
    }
    if (credentials.split("/", 4).length < 4)
        throw new Error('credentials of cookies is invalide');
    const sCredentialArr = credentials.split("/", 3).concat(credentials.split("/").slice(3).join('/'));
    const rThorResult = resolveRoleThor(sCredentialArr[2], subAccountSecretKey);
    return {
        isLogin: rThorResult.isLogin,
        pin: rThorResult.isExpires ? '' : rThorResult.pin,
        adminPin: '',
        isNewSubAccount: false,
        role: {
            accessKey: sCredentialArr[0],
            secretKey: sCredentialArr[1] + rThorResult.userData,
            sessionToken: Buffer.from(sCredentialArr[3]).toString('base64')
        }
    };
}
exports.resolveRoleAccountThor = resolveRoleAccountThor;
/**
 * 解析thor
 *
 * @export
 * @param {*} cookies cookie object
 */
function resolveThor(cookies) {
    if (cookies.credentials) {
        // 用户以角色登录
        return resolveRoleAccountThor(cookies.credentials);
    }
    else if (cookies.sthor) {
        // 用户以子账户登录
        return resolveSubAccountThor(cookies.sthor);
    }
    else if (cookies.thor) {
        // 用户以主账户登录
        return resolveAccountThor(cookies.thor, cookies);
    }
    // 用户未登录
    return {
        isLogin: false,
        pin: '',
        adminPin: '',
        isNewSubAccount: false
    };
}
exports.resolveThor = resolveThor;
//# sourceMappingURL=sub.js.map