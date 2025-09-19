import puppeteer from 'puppeteer-extra';
import Queue from 'bull';
import PostInfo from '../mongodb/schema/schemaurl.js';
import delay from 'delay'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import  {executablePath} from 'puppeteer'
import {createCipheriv } from 'crypto'
import moment from 'moment';
import device_id_list from '../resource/deviceid.json'assert { type: 'json' }
import proxyList from '../resource/proxy.json'  assert { type: 'json' }
import cookie from '../resource/cookiedefault.json'  assert { type: 'json' }
import { pageSign,axiosApiLogin,signUrl } from '../utils/index.js';
import configs from '../configs/index.js';
puppeteer.use(StealthPlugin());
import { RedisMaster } from '../configs/constant.js';
import getLogger from '../utils/logger.js';
import { connectDB } from '../mongodb/config/connect.js';
const logger = getLogger('postapi')
import path from 'path';
import fs from 'fs';
export const  workurl = async(i)=>{
   try {
    const profilesDir = path.resolve('./browser_profiles');
    if (!fs.existsSync(profilesDir)) {
        fs.mkdirSync(profilesDir, { recursive: true });
    }

// Tạo folder profile riêng cho mỗi instance
    const userDataDirPath = path.join(profilesDir, `Profile_UrlPost_${i}`);
    if (!fs.existsSync(userDataDirPath)) {
        fs.mkdirSync(userDataDirPath);
    }
    await connectDB()
    process.setMaxListeners(0);
    var browser = await puppeteer.launch({
        headless: false,
        userDataDir: userDataDirPath,
        args: [
            // `--proxy-server=42.96.11.50:55555`,
            '--enable-features=NetworkService',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--shm-size=8gb', // this solves the issue
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            ignoreHTTPSErrors: true,
            executablePath:executablePath(),  
        });
        await delay(1000)
        var page = await browser.newPage({});
        await page.setBypassCSP(true)
    // }    
        await page.goto("https://www.tiktok.com/",{timeout:60000 })
        await delay(10000)
        await pageSign({page})
        await delay(10000)
        const queueComment = new Queue('TT:URL:GET-POST',RedisMaster)
        const insertBuzzQueue = new Queue(`INSERT-BUZZES`, RedisMaster);
        queueComment.process(configs.concurrency_post,async (job,done)=>{
            try {
                let random_index_device = Math.floor(Math.random() * device_id_list.length);
                let device_id = device_id_list[random_index_device]
                let tiktok_id_video = job.data.urlPost.slice(job.data.urlPost.lastIndexOf('video')+6,job.data.urlPost.lastIndexOf('video')+6+19)
                    const PARAMS = {
                        aid: 1988,
                        app_language: "vi-VN",
                        app_name: "tiktok_web",
                        browser_language: "en-US",
                        browser_name: "Mozilla",
                        browser_online: true,
                        browser_platform: "Win32",
                        browser_version: "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        channel: "tiktok_web",
                        
                        cookie_enabled: true,
                        coverFormat: 2,
                        device_id: device_id,
                        device_platform: "web_pc",
                        focus_state: true,
                        from_page: "video",
                        history_len: 3,
                        is_fullscreen: false,
                        is_page_visible: true,
                    
                    
                        itemId: tiktok_id_video,
                        language: "vi-VN",
                        os: "windows",
                        priority_region: "",
                        referer: "",
                        region: "VN",
                        screen_height: 1080,
                        screen_width: 1920,
                        tz_name: "Asia/Saigon",
                        webcast_language: "vi-VN",
                    };
                    const firstUrl = `https://www.tiktok.com/api/item/detail/?`;
                    var signed_url = await signUrl({PARAMS,page,firstUrl})
                    for(let j=0;j<10;j++){
                        let random_index = Math.floor(Math.random() * proxyList.length);
                        var proxy = proxyList[random_index]
                        let random_index_cookie_array = Math.floor(Math.random() * cookie.length);
                        let index_cookie_array = cookie[random_index_cookie_array]
                        let random_index_cookie_array_unit = Math.floor(Math.random() * index_cookie_array.length);
                        var cookieAxios = index_cookie_array[random_index_cookie_array_unit]                      
                        try {
                            var res = await axiosApiLogin({signed_url,proxy,cookieAxios})
                            var {data ,statusText,status} = res
                            if(data.length!=0&&status==200&&data.statusCode==0&&data.status_code==0){
                                if(data?.itemInfo?.itemStruct?.serverABVersions==undefined){
                                    break
                                }      
                            } 
                            logger.info(`message1:${tiktok_id_video}|reroll:${Object.keys(data).length}|job:${JSON.stringify(job.data)}`)
                            await delay(3000)
                        } catch (error) {
                            await delay(3000)
                            logger.error(`message2:${tiktok_id_video}|reroll:${error}|job:${JSON.stringify(job.data)}`)
                        }
                        
                    }    
                        const {itemInfo,shareMeta} = data ?? {}
                        const {itemStruct} = itemInfo
                        if(itemInfo!=undefined){
                            let shardNumber = moment.unix(itemStruct.createTime).format("GGGGWW");
                            let index = `master${shardNumber}`
                            var dataUrl = {
                                id:`${itemStruct.author.id}_${itemStruct.id}`,
                                type:"tiktokTopic",
                                index:index,
                                siteId:itemStruct.author.id,
                                siteName:itemStruct.author.uniqueId,
                                insertedDate:new Date().toISOString(),
                                publishedDate:new Date(itemStruct.createTime*1000).toISOString(),
                                url: `https://www.tiktok.com/@${itemStruct.author.uniqueId}/video/${itemStruct.id}`,
                                author: itemStruct.author.uniqueId,
                                authorId: itemStruct.author.id,
                                title: "",
                                description: itemStruct.suggestedWords?.toString()?.replace(/\r?\n/g, " ").trim() ?? "",
                                content: itemStruct.desc.replace(/\r?\n/g, " ").trim() ?? "",
                               
                                likes: parseInt(itemStruct.stats.diggCount),
                                shares: parseInt(itemStruct.stats.shareCount),
                                comments: parseInt(itemStruct.stats.commentCount),
                                views: parseInt(itemStruct.stats.playCount),
                                interactions: parseInt(itemStruct.stats.diggCount+itemStruct.stats.shareCount+itemStruct.stats.commentCount+itemStruct.stats.playCount),
                                delayCrawler: "0",
                                delayMongo: "0",
                                delayEs: "0",
                                ds: {
                                    ip : "42.112.777.77",
                                    source : "crawler-v7-tiktok-post-v3"
                                }
                            }   
                            await insertBuzzQueue.add([dataUrl], { removeOnComplete: true }); 
                            logger.info(`message3:${tiktok_id_video}|${Object.keys(data).length}|job:${JSON.stringify(job.data)}`)
                            // const insertMongo =new schemaurl({...dataUrl,postQueue:false})
                            // await insertMongo.save()
                            const checkExistUrl = await PostInfo.findOne({id:dataUrl.id})
                            if(checkExistUrl==null){
                                const insertMongoCopy =new PostInfo({...dataUrl})
                                await insertMongoCopy.save()
                            }   
                        }
                    
                    await delay(1000)  
            
            } catch (error) {
                    console.log(error)
                    logger.error(`message4:${JSON.stringify(job.data)}| ${error}`)  
            }   finally{
                done()

            }
                    
         
        })

   } catch (error) {
    logger.error(`message5: ${error}`)  

    console.log(error.message)
    throw Error(error.message)
   }
 
   
                
 
 
   
}
// (()=>{
//     try{
//         // const queueComment = new Queue('TT:COMMENT',RedisQueueConfig)
//         // queueComment.on('failed', async function (job, error) {
//         //     await queueComment.add(job.data, { removeOnComplete: true })
//         // });
//         // tiktokComment()  
//         if (cluster.isPrimary) {
//             console.log(`Primary ${process.pid} is running`);
        
//             // Fork workers.
//             for (let i = 0; i < 2; i++) {
//             cluster.fork({worker_id:i});
//             }
        
//             cluster.on('exit', (worker, code, signal) => {
//                 cluster.fork();
//                 console.log(`worker ${worker.process.pid} died`);
//             });
//         } else {
//             // Workers can share any TCP connection
//             // In this case it is an HTTP server
//             try{
//                 let worker_id = process.env.worker_id
//                 workurl(i)
//                 console.log(`Worker ${process.pid} started`);
//             }catch(error){
//                 console.log(error)
//                 logger.info({timestamp,message:`resetclusster:${error}`})
//                 // process.exit(1)
//             }     
//         }
       
//     }catch{
//         console.log(error)
//         logger.info({timestamp,message:error})
//         // process.exit(1)
//     }})
for(let i=0;i<1;i++){
    
    workurl(i)
}
