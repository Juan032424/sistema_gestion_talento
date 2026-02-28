const logger = (req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const logColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
        const resetColor = '\x1b[0m';

        console.log(`${logColor}[${new Date().toISOString()}] ${method} ${url} ${status} - ${duration}ms${resetColor}`);
    });

    next();
};

module.exports = logger;
