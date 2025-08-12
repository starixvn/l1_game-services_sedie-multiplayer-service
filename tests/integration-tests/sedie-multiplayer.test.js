describe("SeDieMultiplayer integration tests", () => {
    require("./test-suites/check-connect.test");
    require("./test-suites/sign-in.test");
    // require("./test-suites/in-game.test");
    require("./test-suites/place-bet.test");
    require("./test-suites/settle.test");
    require("./test-suites/pf.test");
    require("./test-suites/get-round-pf.test");
    require("./test-suites/get-history.test");
});
