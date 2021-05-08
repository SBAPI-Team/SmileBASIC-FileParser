class Author {
    public UID: number;
    public Username: string;

    public constructor(uid: number, username: string) {
        this.UID = uid;
        this.Username = username.substr(0, username.indexOf("\0"));
    }
}

export { Author };