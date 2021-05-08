declare global {
    interface Buffer {
        swapBGRA(): Buffer;
    }
}

Buffer.prototype.swapBGRA = function () {
    for (let i = 0; i < this.length; i++) {
        [ this[ i ], this[ i + 2 ] ] = [ this[ i + 2 ], this[ i ] ];
    }
    return this;
};

export { };