

const RedisLocal = 'redis://127.0.0.1:6379'
const RedisMaster =  {
        redis: {
            host: '51.79.21.42',
            port: 1795,
            db: 7,
            password: '98ySUFdCXrFG',
        }
    };
const nameBullMaster = {
    bullInsertBuzzes:`INSERT-BUZZES`
}
export{
    nameBullMaster,
    RedisLocal,
    RedisMaster,
}