import ndarray from "ndarray";
import { DATA_FILE_MAGIC, DATA_TYPE_MAP, DTYPE_MAP, FILE_OFFSETS, FILE_TYPES, ValidDataArrays } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";
import { SmileBASICFileVersion } from "./SmileBASICFileVersion";

class SmileBASICDataFile extends SmileBASICFile {
    public Content: ndarray;

    public constructor() {
        super();
        this.Content = ndarray([]);
    }

    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICDataFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Data
        ) {
            throw new Error("File does not have Data file type");
        }

        let file = new SmileBASICDataFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        let magic = file.RawContent.toString("ascii", FILE_OFFSETS[ SmileBASICFileType.Data ][ "MAGIC" ], FILE_OFFSETS[ SmileBASICFileType.Data ][ "MAGIC" ] + 7);
        if (magic !== DATA_FILE_MAGIC) {
            throw new Error("File does not have data magic.");
        }

        let dataType = file.RawContent.readUInt16LE(FILE_OFFSETS[ SmileBASICFileType.Data ][ "DATA_TYPE" ]);
        if (!(dataType in DATA_TYPE_MAP)) {
            throw new Error(`Unknown data type ${dataType}`);
        }

        let arrayType = DATA_TYPE_MAP[ dataType as keyof typeof DATA_TYPE_MAP ];

        let dimCount = file.RawContent.readUInt16LE(FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_COUNT" ]);
        if (dimCount < 1 || dimCount > 4) {
            throw new Error("Dimension count out of range.");
        }

        let shape: number[] = [];
        for (let i = 0; i < dimCount; i++) {
            shape.push(file.RawContent.readUInt32LE(FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_1" ] + i * 4));
        }

        let dataSize = shape.reduce((acc, val) => acc * val) * arrayType.BYTES_PER_ELEMENT;

        let backingBuffer = Buffer.allocUnsafe(dataSize);
        file.RawContent.copy(backingBuffer, 0, FILE_OFFSETS[ SmileBASICFileType.Data ][ "HEADER_SIZE" ]);

        let newArray = new arrayType(backingBuffer, backingBuffer.byteOffset, backingBuffer.byteLength);

        file.Content = ndarray(newArray, shape);

        return file;
    }

    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICDataFile> {
        let file = await super.FromBuffer(input, verifyFooter);
        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        let dimensions = this.Content.shape;
        if (dimensions.length < 1 || dimensions.length > 4) {
            throw new Error("Dimension count out of range.");
        }

        if (!(this.Content.dtype in DTYPE_MAP)) {
            throw new Error(`dtype must be one of ${Object.keys(DTYPE_MAP).join(", ")}`);
        }

        let dataType = DTYPE_MAP[ this.Content.dtype as keyof typeof DTYPE_MAP ];

        let backingArray = this.Content.data as ValidDataArrays;
        let dataBuffer = Buffer.from(backingArray.buffer, backingArray.byteOffset, backingArray.byteLength);

        let outputBuffer = Buffer.allocUnsafe(dataBuffer.length + FILE_OFFSETS[ SmileBASICFileType.Data ][ "HEADER_SIZE" ]);
        let dataFileVersion = this.Header.Version === SmileBASICFileVersion.SB4 ? '4' : '1';

        outputBuffer.write(DATA_FILE_MAGIC + dataFileVersion, FILE_OFFSETS[ SmileBASICFileType.Data ][ "MAGIC" ], 7, "ascii");
        outputBuffer.writeUInt16LE(dataType, FILE_OFFSETS[ SmileBASICFileType.Data ][ "DATA_TYPE" ]);
        outputBuffer.writeUInt16LE(dimensions.length, FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_COUNT" ]);

        for (let i = 0; i < dimensions.length; i++) {
            outputBuffer.writeUInt32LE(dimensions[ i ], FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_1" ] + i * 4);
        }

        dataBuffer.copy(outputBuffer, FILE_OFFSETS[ SmileBASICFileType.Data ][ "HEADER_SIZE" ], 0);

        this.RawContent = outputBuffer;

        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        AsDataFile(): Promise<SmileBASICDataFile>;
    }
}

SmileBASICFile.prototype[ "AsDataFile" ] = async function () {
    return await SmileBASICDataFile.FromFile(this);
};

export { SmileBASICDataFile };