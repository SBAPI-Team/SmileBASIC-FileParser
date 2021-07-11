import { FILE_TYPES } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

/**
 * Implements operations for reading and writing SmileBASIC {@link SmileBASICFileType.Jpeg} files.
 */
class SmileBASICJpegFile extends SmileBASICFile {
    /** Contains the raw JPEG data contained inside this file. */
    public Content: Buffer;

    public constructor() {
        super();
        this.Content = Buffer.alloc(0);
    }

    /**
     * Converts a base {@link SmileBASICFile} instance into a {@link SmileBASICJpegFile}.
     * @param input The base {@link SmileBASICFile} instance to convert.
     * @returns A Promise resolving to the input file, converted to a SmileBASICJpegFile instance.
     */
    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICJpegFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Jpeg
        ) {
            throw new Error("File does not have Text file type");
        }

        let file = new SmileBASICJpegFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = file.RawContent;

        return file;
    }

    /**
     * Creates a {@link SmileBASICJpegFile} instance from the provided SmileBASIC format file (as a Buffer). Optionally, also verify the footer and throw an error if it is incorrect.
     * @param input A Buffer storing a raw SmileBASIC file
     * @param verifyFooter Set to `true` to throw an error if the file has an invalid footer.
     * @returns A Promise resolving to a SmileBASICJpegFile instance.
     */
    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICJpegFile> {
        let file = await super.FromBuffer(input, verifyFooter);

        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        this.RawContent = this.Content;
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        /**
         * Converts a SmileBASICFile instance to a SmileBASICJpegFile.
         */
        AsJpegFile(): Promise<SmileBASICJpegFile>;
    }
}

SmileBASICFile.prototype[ "AsJpegFile" ] = async function () {
    return await SmileBASICJpegFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Jpeg, SmileBASICJpegFile);


export { SmileBASICJpegFile };