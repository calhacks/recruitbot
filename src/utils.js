const now = () => {
    return ~~(new Date().getTime() / 1000);
}

module.exports = {
    now,
}
