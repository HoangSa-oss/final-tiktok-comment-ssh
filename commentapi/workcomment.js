import puppeteer from 'puppeteer-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Queue from 'bull';
import delay from 'delay'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createLogger, format, transports } from 'winston'
puppeteer.use(StealthPlugin());
const __filename = fileURLToPath(import.meta.url);
import  cluster from 'node:cluster';
import  numCPUs  from 'node:os';
import process from 'node:process';
const __dirname = dirname(__filename);
const { combine, timestamp, printf } = format;
import {workcomment} from './comment/comment.js'
import { workcommentreply } from './comment/commentreply.js';
import { RedisMaster } from '../configs/constant.js';
import getLogger from '../utils/logger.js';
import configs from '../configs/index.js';
const logger = getLogger('commentapi')
const  tiktokComment = async()=>{
    try {
        const queueComment = new Queue('TT:COMMENT',RedisMaster)
        process.setMaxListeners(0);

             queueComment.process(configs.concurrency_comment,async (job,done)=>{
                try{
                    if(job.data.typeCrawl=="comment"){
                        await workcomment(job)
                    }
                    if(job.data.typeCrawl=="reply"){
                       await workcommentreply(job)  
                    }                       
                }catch(error){
                    console.log(error)
                    logger.error(`message1:${error}`)
                }finally{
                    done()
                }
                 
                       
            })   
    } catch (error) {
        console.log(error)
        logger.error(`message2:${error}`)
        throw Error(error.message)
    }
   

   
}
// process.on('unhandledRejection', (err) => {
//     logger.error(`${err.message}`)

//     console.error('Unhandled Rejection:', err);
//     process.exit(1); // trigger cluster master
//   });
  
//   process.on('uncaughtException', (err) => {
//     logger.error(`${err.message}}`)

//     console.error('Uncaught Exception:', err);
//     process.exit(1);
//   });

(()=>{
    try{
        // const queueComment = new Queue('TT:COMMENT',RedisQueueConfig)
        // queueComment.on('failed', async function (job, error) {
        //     await queueComment.add(job.data, { removeOnComplete: true })
        // });
        // tiktokComment()  
        if (cluster.isPrimary) {
            logger.info(`Primary ${process.pid} is running`);
        
            // Fork workers.
            for (let i = 0; i < numCPUs.availableParallelism(); i++) {
            cluster.fork();
            }
        
            cluster.on('exit', (worker, code, signal) => {
                cluster.fork();
                logger.info(`worker ${worker.process.pid} died`);
            });
        } else {
            // Workers can share any TCP connection
            // In this case it is an HTTP server
            try{
                tiktokComment()  
                logger.info(`Worker ${process.pid} started`);
            }catch(error){
                logger.info(error)
                logger.error(`message:resetclusster:${error}`)
                // process.exit(1)
            }     
        }
       
    }catch{
        console.log(error)
        logger.error(`message::${error}`)
        // process.exit(1)
    }
   
    
    
       
       
})()


