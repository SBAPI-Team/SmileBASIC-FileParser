import { SmileBASICFileType } from "./SmileBASICFileType";
import { SmileBASICFileVersion } from "./SmileBASICFileVersion";

const FILE_HEADER_SIZE = {
    [ SmileBASICFileVersion.SB3 ]: 0x50,
    [ SmileBASICFileVersion.SB4 ]: 0x70
};

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
        HEADER_SIZE: 0x50,
        AUTHOR1_NAME: 0x14,
        AUTHOR2_NAME: 0x26,
        AUTHOR1_UID: 0x38,
        AUTHOR2_UID: 0x3C,
        NAME_SIZE: 18
    },
    SB4: {
        HEADER_SIZE: 0x70,
        AUTHOR1_NAME: 0x14,
        AUTHOR2_NAME: 0x34,
        AUTHOR1_UID: 0x54,
        AUTHOR2_UID: 0x58,
        NAME_SIZE: 32
    },
    [ SmileBASICFileType.Data ]: {
        MAGIC: 0x00,
        DATA_TYPE: 0x08,
        DIMENSION_COUNT: 0x0A,
        DIMENSION_1: 0x0C,
        DIMENSION_2: 0x10,
        DIMENSION_3: 0x14,
        DIMENSION_4: 0x18,
        HEADER_SIZE: 0x1C
    },
    FOOTER_SIZE: 20
};

const FILE_TYPES = {
    [ SmileBASICFileVersion.SB3 ]: {
        0x00: SmileBASICFileType.Text,
        0x01: SmileBASICFileType.Data,
        0x02: SmileBASICFileType.Project
    },
    [ SmileBASICFileVersion.SB4 ]: {
        0x00: SmileBASICFileType.Text,
        0x01: SmileBASICFileType.Data,
        0x02: SmileBASICFileType.Data,
        0x03: SmileBASICFileType.Project,
        0x04: SmileBASICFileType.Meta
    }
};

const DATA_TYPE_MAP = {
    0x03: Uint16Array,
    0x04: Int32Array,
    0x05: Float64Array
};

const DTYPE_MAP = {
    'uint16': 0x03,
    'int32': 0x04,
    'float64': 0x05
};

type ValueOf<T> = T[ keyof T ];
type ValidDataArrays = ValueOf<typeof DATA_TYPE_MAP>[ "prototype" ];

const HMAC_KEY = Buffer.from(`nqmby+e9S?{%U*-V]51n%^xZMk8>b{?x]&?(NmmV[,g85:%6Sqd"'U")/8u77UL2`, "ascii");
const DATA_FILE_MAGIC = "PCBN000";

export { FILE_HEADER_SIZE, FILE_OFFSETS, HMAC_KEY, FILE_TYPES, DATA_TYPE_MAP, DATA_FILE_MAGIC, DTYPE_MAP, ValidDataArrays };