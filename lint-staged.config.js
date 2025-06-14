const config = {
    "**/*.ts?(x)": () => "bunx tsc --noEmit",
};

export default config;