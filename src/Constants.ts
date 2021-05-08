import { SmileBASICFileVersion } from "./SmileBASICFileVersion";

const FILE_HEADER_SIZE = {
    [SmileBASICFileVersion.SB3]: 0x50,
    [SmileBASICFileVersion.SB4]: 0x70
}

const FILE_OFFSETS = {
    VERSION: 0x00,
    FILE_TYPE: 0x02,
    FILE_ZLIB: 0x04,
    FILE_ICON: 0x06,
    FILE_SIZE: 0x08,
    DATE_YEAR: 0x0C,
    DATE_MONTH: 0x0E,
    DATE_DAY: 0x0F,
    DATE_HOUR: 0x10,
    DATE_MINUTE: 0x11,
    DATE_SECOND: 0x12,
    UNKNOWN: 0x13,
    SB3: {
        AUTHOR1_NAME: 0x14,
        AUTHOR2_NAME: 0x26,
        AUTHOR1_UID: 0x38,
        AUTHOR2_UID: 0x3C,
        NAME_SIZE: 18
    },
    SB4: {
        AUTHOR1_NAME: 0x14,
        AUTHOR2_NAME: 0x34,
        AUTHOR1_UID: 0x54,
        AUTHOR2_UID: 0x58,
        NAME_SIZE: 32
    },
    FOOTER_SIZE: 20
}

const HMAC_KEY = Buffer.from(`nqmby+e9S?{%U*-V]51n%^xZMk8>b{?x]&?(NmmV[,g85:%6Sqd"'U")/8u77UL2`, "ascii");

export { FILE_HEADER_SIZE, FILE_OFFSETS, HMAC_KEY };