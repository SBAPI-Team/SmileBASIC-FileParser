import ndarray from "ndarray";
import { DATA_FILE_MAGIC, DATA_TYPE_MAP, DTYPE_MAP, FILE_OFFSETS, FILE_TYPES, ValidDataArrays } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";
import { SmileBASICFileVersion } from "./SmileBASICFileVersion";

/**
 * Implements operations for reading and writing SmileBASIC {@link SmileBASICFileType.Data} files.
 */
class SmileBASICDataFile extends SmileBASICFile {
    /**
     * The content of the file as a NdArray.
     * 
     * The `dtype` of this NdArray can only be a number type or a string type. Any others are invalid.
    */
    public Content: ndarray.NdArray<number | string>;

    /**
     * Gets the internal data type of this file, or NaN if it's invalid.
     */
    public get DataType(): number {
        return DTYPE_MAP[ this.Content.dtype as keyof typeof DTYPE_MAP ] ?? NaN;
    }

    public constructor() {
        super();
        this.Content = ndarray([]);
    }


    /**
     * Converts a base {@link SmileBASICFile} instance into a {@link SmileBASICDataFile}.
     * @param input The base {@link SmileBASICFile} instance to convert.
     * @returns A Promise resolving to the input file, converted to a SmileBASICDataFile instance.
     */
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
        // if (magic !== DATA_FILE_MAGIC) {
        //     throw new Error("File does not have data magic.");
        // }

        let dataType = file.RawContent.readUInt16LE(FILE_OFFSETS[ SmileBASICFileType.Data ][ "DATA_TYPE" ]);

        if (dataType !== 0x06 && !(dataType in DATA_TYPE_MAP)) {
            throw new Error(`Unknown data type ${dataType}`);
        }

        let dimCount = file.RawContent.readUInt16LE(FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_COUNT" ]);
        if (dimCount < 1 || dimCount > 4) {
            throw new Error("Dimension count out of range.");
        }

        let shape: number[] = [];
        for (let i = 0; i < dimCount; i++) {
            shape.push(file.RawContent.readUInt32LE(FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_1" ] + i * 4));
        }

        // String data files apparently exist, and now we gotta handle them.
        if (dataType === 0x06) {
            let backingArray: string[] = [];
            const stringCount = shape.reduce((acc, dim) => acc * dim);
            let offset = FILE_OFFSETS[ SmileBASICFileType.Data ][ "HEADER_SIZE" ];

            while (backingArray.length < stringCount) {
                let size = file.RawContent[ offset++ ];
                backingArray.push(file.RawContent.toString("utf8", offset, offset += size));
            }

            file.Content = ndarray(backingArray, shape);
        } else {

            let arrayType = DATA_TYPE_MAP[ dataType as keyof typeof DATA_TYPE_MAP ];
            let dataSize = shape.reduce((acc, val) => acc * val) * arrayType.BYTES_PER_ELEMENT;

            let backingBuffer = Buffer.allocUnsafe(dataSize);
            file.RawContent.copy(backingBuffer, 0, FILE_OFFSETS[ SmileBASICFileType.Data ][ "HEADER_SIZE" ], FILE_OFFSETS[ SmileBASICFileType.Data ][ "HEADER_SIZE" ] + dataSize);

            let newArray = new arrayType(new Uint8Array(backingBuffer.buffer.slice(backingBuffer.byteOffset, backingBuffer.byteOffset + backingBuffer.byteLength)).buffer);

            file.Content = ndarray(newArray, shape);
        }

        return file;
    }

    /**
     * Creates a {@link SmileBASICDataFile} instance from the provided SmileBASIC format file (as a Buffer). Optionally, also verify the footer and throw an error if it is incorrect.
     * @param input A Buffer storing a raw SmileBASIC file
     * @param verifyFooter Set to `true` to throw an error if the file has an invalid footer.
     * @returns A Promise resolving to a SmileBASICDataFile instance.
     */
    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICDataFile> {
        let file = await super.FromBuffer(input, verifyFooter);
        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        let dimensions = this.Content.shape;
        if (dimensions.length < 1 || dimensions.length > 4) {
            throw new Error("Dimension count out of range.");
        }

        if (!(this.Content.dtype === "array" && this.Content.data.find((value: string | number) => typeof value !== "string") == null) && !(this.Content.dtype in DTYPE_MAP)) {
            throw new Error(`dtype must be one of ${Object.keys(DTYPE_MAP).join(", ")} or must be an array of only strings.`);
        }

        let dataType = this.Content.dtype === "array" ? 0x06 : DTYPE_MAP[ this.Content.dtype as keyof typeof DTYPE_MAP ];

        let backingArray = this.Content.data as ValidDataArrays | string[];
        let dataFileVersion = this.Header.Version === SmileBASICFileVersion.SB4 ? '4' : '1';

        let headerBuffer = Buffer.allocUnsafe(FILE_OFFSETS[ SmileBASICFileType.Data ][ "HEADER_SIZE" ]);

        headerBuffer.write(DATA_FILE_MAGIC + dataFileVersion, FILE_OFFSETS[ SmileBASICFileType.Data ][ "MAGIC" ], 7, "ascii");
        headerBuffer.writeUInt16LE(dataType, FILE_OFFSETS[ SmileBASICFileType.Data ][ "DATA_TYPE" ]);
        headerBuffer.writeUInt16LE(dimensions.length, FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_COUNT" ]);

        for (let i = 0; i < dimensions.length; i++) {
            headerBuffer.writeUInt32LE(dimensions[ i ], FILE_OFFSETS[ SmileBASICFileType.Data ][ "DIMENSION_1" ] + i * 4);
        }

        if (dataType === 0x06) {
            let ba = backingArray as string[];
            let dataBufferSize = ba.reduce((acc, str) => acc + str.length + 1, 0);
            let dataBuffer = Buffer.allocUnsafe(dataBufferSize);

            let offset = 0;
            for (let i = 0; i < ba.length; i++) {
                let entry = ba[ i ];
                if (entry.length > 255) {
                    throw new Error(`entry ${i} has length > 255, which is not allowed.`);
                }
                dataBuffer[ offset++ ] = entry.length;
                dataBuffer.write(entry, offset, "utf8");
                offset += entry.length;
            }

            this.RawContent = Buffer.concat([ headerBuffer, dataBuffer ]);
        } else {
            let ba = backingArray as ValidDataArrays;
            let dataBuffer = Buffer.from(ba.buffer, ba.byteOffset, ba.byteLength);
            this.RawContent = Buffer.concat([ headerBuffer, dataBuffer ]);
        }

        return await super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        /**
         * Converts a SmileBASICFile instance to a SmileBASICDataFile.
         */
        AsDataFile(): Promise<SmileBASICDataFile>;
    }
}

SmileBASICFile.prototype[ "AsDataFile" ] = async function () {
    return await SmileBASICDataFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Data, SmileBASICDataFile);


export { SmileBASICDataFile };