import { FILE_TYPES } from "./Constants";
import { SmileBASIC4ProjectContent } from "./SmileBASIC4ProjectContent";
import { SmileBASICFile } from "./SmileBASICFile";
import { SmileBASICFileType } from "./SmileBASICFileType";

/**
 * Implements operations for reading and writing SmileBASIC {@link SmileBASICFileType.Project4} files.
 */
class SmileBASIC4ProjectFile extends SmileBASICFile {
    /**
     * The content of the file, stored in a {@link SmileBASIC4ProjectContent} instance.
     */
    public Content: SmileBASIC4ProjectContent;

    public constructor() {
        super();
        this.Content = new SmileBASIC4ProjectContent();
    }

    /**
     * Converts a base {@link SmileBASICFile} instance into a {@link SmileBASIC4ProjectFile}.
     * @param input The base {@link SmileBASICFile} instance to convert.
     * @returns A Promise resolving to the input file, converted to a SmileBASIC4ProjectFile instance.
     */
    public static async FromFile(input: SmileBASICFile): Promise<SmileBASIC4ProjectFile> {
        if (
            !(input.Header.FileType in FILE_TYPES[ input.Header.Version ]) ||
            (FILE_TYPES[ input.Header.Version ] as any)[ input.Header.FileType ] !== SmileBASICFileType.Project4
        ) {
            throw new Error("File does not have Project4 file type");
        }

        let file = new SmileBASIC4ProjectFile();
        file.Header = input.Header;
        file.RawContent = input.RawContent;
        file.Footer = input.Footer;

        file.Content = await SmileBASIC4ProjectContent.FromBuffer(file.RawContent);

        return file;
    }

    /**
     * Creates a {@link SmileBASIC4ProjectFile} instance from the provided SmileBASIC format file (as a Buffer). Optionally, also verify the footer and throw an error if it is incorrect.
     * @param input A Buffer storing a raw SmileBASIC file
     * @param verifyFooter Set to `true` to throw an error if the file has an invalid footer.
     * @returns A Promise resolving to a SmileBASIC4ProjectFile instance.
     */
    public static async FromBuffer(input: Buffer, verifyFooter: boolean = false): Promise<SmileBASIC4ProjectFile> {
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
         * Converts a SmileBASICFile instance to a SmileBASIC4ProjectFile.
         */
        AsProject4File(): Promise<SmileBASIC4ProjectFile>;
    }
}

SmileBASICFile.prototype[ "AsProject4File" ] = async function () {
    return SmileBASIC4ProjectFile.FromFile(this);
};

SmileBASICFile.FileTypeMappings.set(SmileBASICFileType.Project4, SmileBASIC4ProjectFile);


export { SmileBASIC4ProjectFile };