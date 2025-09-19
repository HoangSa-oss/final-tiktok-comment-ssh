import puppeteer from 'puppeteer-extra';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Queue from 'bull';

import { HttpsProxyAgent } from 'https-proxy-agent';
import _ from 'lodash'

import delay from 'delay'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import  {executablePath} from 'puppeteer'
import {createCipheriv } from 'crypto'
import moment from 'moment';
import fs from 'fs/promises'
import { createLogger, format, transports } from 'winston'
import device_id_list from '../../resource/deviceid.json'assert { type: 'json' }

import proxyList from '../../resource/proxy.json'  assert { type: 'json' }
puppeteer.use(StealthPlugin());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { RedisMaster } from '../../configs/constant.js';
import getLogger from '../../utils/logger.js';
const logger = getLogger('commentreply')
const insertBuzzQueue = new Queue(`INSERT-BUZZES`, RedisMaster);

export const  workcommentreply = async(job)=>{
    try {
        let random_index_device = Math.floor(Math.random() * device_id_list.length);
        let device_id = device_id_list[random_index_device]  
        let conditionBreak = 0
        for(var j=0;j<100;j++){
           
            let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            let signed_url = `https://www.tiktok.com/api/comment/list/reply/?aid=1988&comment_id=${job.data.cid}&item_id=${job.data.aweme_id}&count=50&cursor=${j*50}`

            for(let i=0;i<20;i++){
                let random_index = Math.floor(Math.random() * proxyList.length);
                var proxy = proxyList[random_index]
                try {
                    var start1 = performance.now()
                    var res = await testApiReq({userAgent,signed_url,proxy})
                    var end1 = performance.now()

                    var{data ,statusText,status} = res
                    if(data.length!=0&&status==200){
                        break
                    }
                    logger.info(`message1:${job.data.vid}:${job.data.cid}|reroll:${Object.keys(data).length}|cursor:${j*50}`)
                    await delay(3000)
                } catch (error) {
                    await delay(500)
                    console.log(error)
                    logger.error(`message2:${job.data.vid}:${job.data.cid}|reroll:${error}|cursor:${j*50}`)
                }
            
            }    
            var {comments,cursor,has_more,status_code,status_msg,total} = data ?? {}
    
            if(data.comments!=undefined&&data.comments.length!=0){
                conditionBreak==0
                var arrayComment = []
                data.comments.map(async(item)=>{
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
                            url : `${job.data.urlPost}?cid=${Buffer.from(item.cid).toString('base64').replaceAll('=','')}`,
                            author : item.user.nickname,
                            authorId : item.user.unique_id,
                            title : job.data?.title,                                                
                            description:job.data.description ??"",
                            content : item.text.replace(/\r?\n/g, " ").trim() ?? "",
                            parentDate : job.data.parentDate,
                            parentId : job.data.parentId,
                            likes : parseInt(item.digg_count),
                            shares : parseInt("0"),
                            comments : parseInt("0"),
                            interactions : parseInt(item.digg_count),
                            delayMongo : "0",
                            delayEs : "0",
                            delayCrawler : "0",
                            ds: {
                                ip : "42.112.777.77",
                                source : "crawler-v7-tiktok-commentreply-v9"
                            }
                        }
                        arrayComment.push(insert)    
                    }   
                )
                const arrayAddQueue =  _.chunk(arrayComment,10)
                var start2 = performance.now()
                for await (const x of arrayAddQueue){
                    await insertBuzzQueue.add(x, { removeOnComplete: true });  
                }
                var end2 = performance.now()
            }
            logger.info(`message3:${job.data.aweme_id}:${job.data.cid}|${Object.keys(data).length}|commentLength:${comments?.length}|axios:${end1-start1}|add:${end2-start2}`)
            if(has_more==0||has_more==undefined||total==0||comments==undefined||comments==null||comments.length==0){
                conditionBreak++
            }
            if(conditionBreak==1){
                break
            }
        }
    } catch (error) {
        logger.error(`message4:${job.data.cid}:${job.data.vid}|${error}`)

    }
         

    
}


async function xttparams(query_str) {
    query_str += "&is_encryption=1";
    const password = "webapp1.0+202106";
    // Encrypt query string using aes-128-cbc
    const cipher = createCipheriv("aes-128-cbc", password, password);
    return Buffer.concat([cipher.update(query_str), cipher.final()]).toString(
        "base64"
    );
}
async function testApiReq({ userAgent, signed_url,proxy}) {
    try {
        const response = await axios(signed_url, {
            timeout:10000,
            httpsAgent: new HttpsProxyAgent(proxy.proxy),
            headers:{
                "user-agent": userAgent,
                // "referer": referer,  
            }
          });
          return response
    } catch (error) {
        console.log(error.message)
        return error
    }


}
async function generateVerifyFp() {
    var e = Date.now();
    var t = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(
        ""
        ),
        e = t.length,
        n = Date.now().toString(36),
        r = [];
    (r[8] = r[13] = r[18] = r[23] = "_"), (r[14] = "4");
    for (var o = 0, i = void 0; o < 36; o++)
        r[o] ||
        ((i = 0 | (Math.random() * e)), (r[o] = t[19 == o ? (3 & i) | 8 : i]));
    return "verify_" + n + "_" + r.join("");
} 