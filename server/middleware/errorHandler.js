const errorHandler = (err, req, res, next) => {
    console.error('\x1b[31m[ERROR]\x1b[0m', err.stack);

    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    res.status(statusCode).json({
        error: true,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
};

module.exports = errorHandler;
