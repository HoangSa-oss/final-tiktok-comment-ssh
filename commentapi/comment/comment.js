import puppeteer from 'puppeteer-extra';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios, { AxiosHeaders } from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Queue from 'bull';
import delay from 'delay'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import device_id_list from '../../resource/deviceid.json'assert { type: 'json' }
import proxyList from '../../resource/proxy.json'  assert { type: 'json' }
puppeteer.use(StealthPlugin());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import moment from 'moment';
import { Buffer } from 'buffer';
import _ from 'lodash'
import { RedisMaster } from '../../configs/constant.js';
import getLogger from '../../utils/logger.js';
const logger = getLogger('comment')

const insertBuzzQueue = new Queue(`INSERT-BUZZES`, RedisMaster);
const queueComment = new Queue('TT:COMMENT',RedisMaster)

export const  workcomment =  async(job)=>{
    try {
        let random_index_device = Math.floor(Math.random() * device_id_list.length);
        let device_id = device_id_list[random_index_device]
        let tiktok_id_video = job.data.url.slice(job.data.url.lastIndexOf('video')+6,job.data.url.lastIndexOf('video')+6+19)
        let conditionBreak = 0
        for(let i=0;i<1500;i++){
            let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            let signed_url = `https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id=${tiktok_id_video}&count=50&cursor=${i*50}`
            for(let j=0;j<20;j++){
                let random_index = Math.floor(Math.random() * proxyList.length);
                var proxy = proxyList[random_index]
                try {
                    
                    const res = await axios(signed_url, {
                        timeout:20000,
                        httpsAgent: new HttpsProxyAgent(proxy.proxy),
                        headers:{
                            "user-agent": userAgent,
                        }
                    });
                    var{data ,statusText,status,headers} = res
                    if(data.length!=0&&status==200){
                        break
                    }
                    logger.info(`message1:${tiktok_id_video}|reroll:${Object.keys(data).length}|${statusText}|job:${JSON.stringify(job.data.id)}|cursor:${i*50}`)
                    await delay(3000)
                } catch (error) {
                    await delay(3000)
                    console.log(error.message)
                    logger.error(`message2:${tiktok_id_video}|reroll:${error.message}|job:${JSON.stringify(job.data.id)}|cursor:${i*50}`)
                }
            
            }    
            var {comments,has_more,total} = data ?? {}
            if(comments!=undefined&&comments.length!=0){
                conditionBreak = 0
                var arrayComment = []
                var start1 = performance.now();
                for await(const item of comments){
                    await delay(50)
                    let shardNumber = moment.unix(item.create_time).format("GGGGWW");
                    let index = `master${shardNumber}`
                        let insert = {
                            id :`${item.aweme_id}_${item.cid}`   ,                                       
                            type : "tiktokComment",
                            index : index,
                            siteId : job.data.siteId,
                            siteName : job.data.siteName,
                            insertedDate: new Date().toISOString(),
                            publishedDate :new Date(item.create_time*1000).toISOString(),
                            url : `${job.data.url}?cid=${Buffer.from(item.cid).toString('base64').replaceAll('=','')}`,
                            author : item.user.nickname,
                            authorId : item.user.unique_id,
                            title : job.data?.content,                                                
                            description:job.data?.description,
                            content : item.text.replace(/\r?\n/g, " ").trim(),
                            parentDate : job.data?.publishedDate,
                            parentId : job.data.id,
                            likes : parseInt(item.digg_count),
                            shares : parseInt("0"),
                            comments : parseInt(item.reply_comment_total),
                            interactions : parseInt(item.digg_count+item.reply_comment_total),
                            delayMongo : "0",
                            delayEs : "0",
                            delayCrawler : "0",
                            ds: {
                                ip : "42.112.777.77",
                                source : "crawler-v7-tiktok-comment-v9"
                            }              
                        }
                        arrayComment.push(insert)
                        if(insert.comments>0){
                            await queueComment.add({  
                                cid:item.cid,
                                aweme_id:item.aweme_id,
                                siteId:insert.siteId,
                                siteName:insert.siteName,
                                description:insert.description,
                                parentDate:insert.parentDate,
                                parentId:insert.parentId,
                                urlPost:job.data.url,
                                title : job.data?.content,   
                                typeCrawl:"reply"
                            }, { removeOnComplete: true })
                        }
                }
                var end1 = performance.now();
                const arrayAddQueue =  _.chunk(arrayComment,10)
                var start2 = performance.now();
                for await (const x of arrayAddQueue){
                    await insertBuzzQueue.add(x, { removeOnComplete: true });  
                }
                var end2 = performance.now()
            }
                logger.info(`message3:${tiktok_id_video}:${Object.keys(data).length}|commentLength:${comments?.length}|timeaxios:${end1-start1}|add:${end2-start2},${statusText}|job:${JSON.stringify(job.data.id)}|cursor:${i*50}`)
                if(has_more==0||has_more==undefined||total==0||comments==undefined||comments==null||comments.length==0){
                    conditionBreak++
                }
                if(conditionBreak==3){
                    break
                }
        }              
    } catch (error) {
            console.log(error)
            logger.error(`message:comment4:${job.data.urlPost}| ${error}`)
           
        ;     
    }    
           
}

