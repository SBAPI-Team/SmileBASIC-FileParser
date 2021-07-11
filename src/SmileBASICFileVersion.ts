import type { Author } from "./Author";
import type { SmileBASICFileType } from "./SmileBASICFileType";

/**
 * Normalized values for different SmileBASIC file versions.
 */
enum SmileBASICFileVersion {
    /**
     * SmileBASIC 3 files have a 0x50 byte header, and use 18 bytes for {@link Author} usernames in the header.
     * 
     * **File version byte:** `<= 0x03`
     * 
     * **Supported file types:** {@link SmileBASICFileType.Text TXT/PRG}, {@link SmileBASICFileType.Data DAT/GRP}, {@link SmileBASICFileType.Project3 PRJ}
     */
    SB3,
    /**
     * SmileBASIC 4 files have a 0x70 byte header, and use 32 bytes for {@link Author} usernames in the header.
     *
     * **File version byte:** `>= 0x04`
     *
     * **Supported file types:** {@link SmileBASICFileType.Text TXT/PRG}, {@link SmileBASICFileType.Data DAT/GRP}, {@link SmileBASICFileType.Project4 PRJ}, {@link SmileBASICFileType.Meta META}, {@link SmileBASICFileType.Jpeg JPEG}
     */
    SB4
}

export { SmileBASICFileVersion };