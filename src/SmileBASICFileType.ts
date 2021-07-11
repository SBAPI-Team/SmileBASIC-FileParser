import type { SmileBASICFileVersion } from "./SmileBASICFileVersion";
import type { SmileBASICTextFile } from "./SmileBASICTextFile";
import type { SmileBASICDataFile } from "./SmileBASICDataFile";
import type { SmileBASIC3ProjectFile } from "./SmileBASIC3ProjectFile";
import type { SmileBASIC4ProjectFile } from "./SmileBASIC4ProjectFile";
import type { SmileBASICMetaFile } from "./SmileBASICMetaFile";
import type { SmileBASICJpegFile } from "./SmileBASICJpegFile";

/**
 * Normalized values for different file types in use by SmileBASIC.
 */
enum SmileBASICFileType {
    /**
     * Text files store text as UTF-8 strings. These are used internally for SmileBASIC PRG and TXT files.
     * 
     * **Raw file type:** `0x00` ({@link SmileBASICFileVersion.SB3 SB3} & {@link SmileBASICFileVersion.SB4 SB4})
     *
     * **Internal filename prefix**: `T`
     * 
     * **Implementing class:** {@link SmileBASICTextFile}
     */
    Text,

    /**
     * Data files store array data (either number (SB3 and SB4) or string (SB4-only)) in a row-column based format.
     * 
     * **Raw file type:** `0x01` ({@link SmileBASICFileVersion.SB3 SB3} & {@link SmileBASICFileVersion.SB4 SB4}), `0x02` ({@link SmileBASICFileVersion.SB4 SB4})
     * 
     * **Internal filename prefix**: `B` ({@link SmileBASICFileVersion.SB3 SB3} & {@link SmileBASICFileVersion.SB4 SB4}), `G` ({@link SmileBASICFileVersion.SB4 SB4})
     * 
     * **Implementing class:** {@link SmileBASICDataFile}
     */
    Data,

    /**
     * SmileBASIC 3 project files store a collection of SmileBASIC files, which are unpacked when downloaded to a file structure.
     *
     * **Raw file type:** `0x02` ({@link SmileBASICFileVersion.SB3 SB3})
     *
     * **Internal filename prefix**: `P` ({@link SmileBASICFileVersion.SB3 SB3})
     * 
     * **Implementing class:** {@link SmileBASIC3ProjectFile}
     */
    Project3,

    /**
     * SmileBASIC 4 project files store metadata about a project and a collection of SmileBASIC files, which are unpacked when downloaded to a file structure.
     *
     * **Raw file type:** `0x03` ({@link SmileBASICFileVersion.SB4 SB4})
     *
     * **Internal filename prefix**: `P` ({@link SmileBASICFileVersion.SB4 SB4})
     *
     * **Implementing class:** {@link SmileBASIC4ProjectFile}
     */
    Project4,

    /**
     * META files store metadata about a project, such as the project name and description, and the icon shown in the project list.
     *
     * **Raw file type:** `0x04` ({@link SmileBASICFileVersion.SB4 SB4})
     *
     * **Internal filename prefix**: `META` ({@link SmileBASICFileVersion.SB4 SB4})
     *
     * **Implementing class:** {@link SmileBASICMetaFile}
     */
    Meta,

    /**
     * JPEG files wrap a full JPEG file storing graphical data, usually compressed.
     *
     * **Raw file type:** `0x05` ({@link SmileBASICFileVersion.SB4 SB4})
     *
     * **Internal filename prefix**: `J` ({@link SmileBASICFileVersion.SB4 SB4})
     *
     * **Implementing class:** {@link SmileBASICJpegFile}
     */
    Jpeg
}

export { SmileBASICFileType };