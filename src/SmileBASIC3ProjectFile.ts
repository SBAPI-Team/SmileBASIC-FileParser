import { FILE_TYPES } from "./Constants";
import { SmileBASIC3ProjectContent } from "./SmileBASIC3ProjectContent";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

/**
 * Implements operations for reading and writing SmileBASIC {@link SmileBASICFileType.Project3} files.
 */
class SmileBASIC3ProjectFile extends SmileBASICFile {
    /**
     * The content of the file, stored in a {@link SmileBASIC3ProjectContent} instance.
    */
    public Content: SmileBASIC3ProjectContent;

    public constructor() {
        super();
        this.Content = new SmileBASIC3ProjectContent();
    }

    /**
     * Converts a base {@link SmileBASICFile} instance into a {@link SmileBASIC3ProjectFile}.
     * @param input The base {@link SmileBASICFile} instance to convert.
     * @returns A Promise resolving to the input file, converted to a SmileBASIC3ProjectFile instance.
     */
    public static async FromFile(input: SmileBASICFile): Promise<SmileBASIC3ProjectFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Project3
        ) {
            throw new Error("File does not have Text file type");
        }

        let file = new SmileBASIC3ProjectFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = await SmileBASIC3ProjectContent.FromBuffer(file.RawContent);

        return file;
    }

    /**
     * Creates a {@link SmileBASIC3ProjectFile} instance from the provided SmileBASIC format file (as a Buffer). Optionally, also verify the footer and throw an error if it is incorrect.
     * @param input A Buffer storing a raw SmileBASIC file
     * @param verifyFooter Set to `true` to throw an error if the file has an invalid footer.
     * @returns A Promise resolving to a SmileBASIC3ProjectFile instance.
     */
    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASIC3ProjectFile> {
        let file = await super.FromBuffer(input, verifyFooter);

        return this.FromFile(file);
    }

    public async ToBuffer(): Promise<Buffer> {
        this.RawContent = await this.Content.ToBuffer();
        return super.ToBuffer();
    }
}

// We have to do this to prevent circular dependencies, but it's also nice since it decouples the casting.
declare module "./SmileBASICFile" {
    interface SmileBASICFile {
        /**
         * Converts a SmileBASICFile instance to a SmileBASIC3ProjectFile.
         */
        AsProject3File(): Promise<SmileBASIC3ProjectFile>;
    }
}

SmileBASICFile.prototype[ "AsProject3File" ] = async function () {
    return SmileBASIC3ProjectFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Project3, SmileBASIC3ProjectFile);

export { SmileBASIC3ProjectFile };