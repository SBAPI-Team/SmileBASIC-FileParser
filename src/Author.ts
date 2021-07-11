/**
 * Stores information about the author of a SmileBASIC file.
 */
class Author {
    /** The internal ID number of the author. Used for blacklisting. */
    public UID: number;
    /** The username of this user. Shown in file browsers. */
    public Username: string;

    /**
     * Creates a new instance with the provided UID and Username.
     * @param uid The UID of the author.
     * @param username The username of the author.
     */
    public constructor(uid: number, username: string) {
        this.UID = uid;
        this.Username = username.substr(0, username.indexOf("\0"));
    }
}

export { Author };