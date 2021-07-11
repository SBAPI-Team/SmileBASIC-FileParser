import { FILE_TYPES } from "./Constants";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

/**
 * Implements operations for reading and writing SmileBASIC {@link SmileBASICFileType.Text} files.
 */
class SmileBASICTextFile extends SmileBASICFile {
    /** The content of this file as a string. */
    public Content: string;

    public constructor() {
        super();
        this.Content = "";
    }
    /**
     * Converts a base {@link SmileBASICFile} instance into a {@link SmileBASICTextFile}.
     * @param input The base {@link SmileBASICFile} instance to convert.
     * @returns A Promise resolving to the input file, converted to a SmileBASICTextFile instance.
     */
    public static async FromFile(input: SmileBASICFile): Promise<SmileBASICTextFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Text
        ) {
            throw new Error("File does not have Text file type");
        }

        let file = new SmileBASICTextFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = file.RawContent.toString("utf8");

        return file;
    }

    /**
     * Creates a {@link SmileBASICTextFile} instance from the provided SmileBASIC format file (as a Buffer). Optionally, also verify the footer and throw an error if it is incorrect.
     * @param input A Buffer storing a raw SmileBASIC file
     * @param verifyFooter Set to `true` to throw an error if the file has an invalid footer.
     * @returns A Promise resolving to a SmileBASICTextFile instance.
     */
    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASICTextFile> {
        let file = await super.FromBuffer(input, verifyFooter);

        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        this.RawContent = Buffer.from(this.Content, "ucs2");
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        /**
         * Converts a SmileBASICFile instance to a SmileBASICTextFile.
         */
        AsTextFile(): Promise<SmileBASICTextFile>;
    }
}

SmileBASICFile.prototype[ "AsTextFile" ] = async function () {
    return await SmileBASICTextFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Text, SmileBASICTextFile);


export { SmileBASICTextFile };