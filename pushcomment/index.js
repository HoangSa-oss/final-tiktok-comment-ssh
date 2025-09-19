import moment from 'moment';
import PostInfo from '../mongodb/schema/schemaurl.js';
import Queue from 'bull';
import getLogger from '../utils/logger.js';
import { schedule } from 'node-cron';
import { RedisMaster } from '../configs/constant.js';
import { connectDB } from '../mongodb/config/connect.js';
import delay from 'delay';
const timeMonthly = moment().startOf('month').format('X')
const logger = getLogger('pushcomment')
const commentQueue = new Queue(`TT:COMMENT`, RedisMaster);
const postKeyword = async ()=>{
    try {
        await connectDB()
        const daily = 4
        const  timeDaily = moment().subtract(daily, 'days').startOf('day').format('X')
        const checkQueueEmpty = await commentQueue.count()
        let id_list_delete = []
        console.log(checkQueueEmpty)
        const dailyISO = new Date(timeDaily*1000).toISOString()
        console.log(dailyISO)
        var comment_length = 0
        if(checkQueueEmpty<30){
            for(let i=0;i<200;i++){
                    const getPostToComment = await PostInfo.aggregate([
                        {$match:{publishedDate:{$gte:dailyISO}}},
                        {$skip:i*10000},
                        {$limit:10000},
                    
                    ])
                    console.log(getPostToComment)
                    if(getPostToComment.length==0){
                        break
                    }
                    comment_length=comment_length+getPostToComment.length
                    // await Promise.all(getPostToComment.map(async(x)=>{
                    //     const {_id,postQueue,...data} = x
                    //     await commentQueue.add({...data,typeCrawl:"comment"}, { removeOnComplete: true })
                    // })   )
                    const promiseAll = getPostToComment.map(async(x)=>{
                            const {_id,postQueue,...data} = x
                            await commentQueue.add({...data,typeCrawl:"comment"}, { removeOnComplete: true ,    attempts: 4 })
                        }) 
                    await Promise.all(promiseAll)
                    logger.info(`listLength:${comment_length}|message:Pushing`)
    
                    await delay(5000)           
            }
            logger.info(`listLength:${comment_length}|message:Done`)
        }else{
            const getPostToDelete = await PostInfo.aggregate([
                {$match:{publishedDate:{$lt:dailyISO}}},
                {$limit:1000}
            ])
            getPostToDelete.map(async(x)=>{
                const {_id} = x
                id_list_delete.push(_id)
            })
            await PostInfo.deleteMany(
                {"_id":{$in:id_list_delete} },
            )
            logger.info(`message:DoneRemove`)
        }
    
    } catch (error) {
        logger.error(`listLength:${comment_length}|message:${error}`)
        console.log(error)
        throw Error(error.message)
    }
    
}
    await postKeyword()

schedule(`*/2 * * * *`, async() => {
    await postKeyword()
    // await postReplyComment()
//    await postDataHashTag()
//    await postDataAuthor()
});
  

// const postDataHashTag = async()=>{
//     try {
//         let dataDaily = await schemahashtag.aggregate([
//             {$match:{date:{$gte:Number(timeDaily)},postApi:false}},
//             { $limit : 10 }
//         ])
//         if(dataDaily.length==0){
//             let dataMonthly = await schemahashtag.aggregate([
//                 {$match:{date:{$gte:Number(timeMonthly),$lte:Number(timeDaily)},postApi:false}},
//                 { $limit : 10 }
//             ])
//             let id_list_monthly = []
//             let data_list_monthly=[]
//             dataMonthly.map((x)=>{   
//                 id_list_monthly.push(x._id)
//                 data_list_monthly.push({hashtag:x.hashtag,urlPost:x.urlPost,date:x.date,crawl:"monthly"})
//             })
//             await schemahashtag.deleteMany(
//                 {"_id":{$in:id_list_monthly} },
//                 {$set:{postApi:true}}
//             )
//             data_list_monthly.map(async(x)=>{
//                 await queueUrlGetPost.add(x,{ priority: 2 }, { removeOnComplete: true });    
        
//             })
    
//         }
//         let id_list_daily = []
//         let data_list_daily =[]
//         dataDaily.map((x)=>{   
//             id_list_daily.push(x._id)
//             data_list_daily.push({hashtag:x.hashtag,urlPost:x.urlPost,date:x.date,crawl:"daily"})
//         })
//         await schemahashtag.deleteMany(
//             {"_id":{$in:id_list_daily} },
//             {$set:{postApi:true}}
//         )
//         data_list_daily.map(async(x)=>{
//             await queueUrlGetPost.add(x,{ priority: 1 },{ removeOnComplete: true });    
//         })
    
//         console.log('done')
//     } catch (error) {
//         console.log(error)
//     }
   
// }
// const postDataAuthor = async()=>{
//     try {
//         let dataDaily = await schemaauthor.aggregate([
//             {$match:{date:{$gte:Number(timeDaily)},postApi:false}},
//             { $limit : 10 }
//         ])
//         if(dataDaily.length==0){
//             let dataMonthly = await schemaauthor.aggregate([
//                 {$match:{date:{$gte:Number(timeMonthly),$lte:Number(timeDaily)},postApi:false}},
//                 { $limit : 10 }
//             ])
//             let id_list_monthly = []
//             let data_list_monthly=[]
//             dataMonthly.map((x)=>{   
//                 id_list_monthly.push(x._id)
//                 data_list_monthly.push({author:x.author,urlPost:x.urlPost,date:x.date,crawl:"monthly"})
//             })
//             await schemaauthor.deleteMany(
//                 {"_id":{$in:id_list_monthly} },
//                 {$set:{postApi:true}}
//             )
//             data_list_monthly.map(async(x)=>{
//                 await queueUrlGetPost.add(x,{ priority: 2 }, { removeOnComplete: true });    
        
//             })
    
//         }
//         let id_list_daily = []
//         let data_list_daily =[]
//         dataDaily.map((x)=>{   
//             id_list_daily.push(x._id)
//             data_list_daily.push({author:x.author,urlPost:x.urlPost,date:x.date,crawl:"daily"})
//         })
//         await schemaauthor.deleteMany(
//             {"_id":{$in:id_list_daily} },
//             {$set:{postApi:true}}
//         )
//         data_list_daily.map(async(x)=>{
//             await queueUrlGetPost.add(x,{ priority: 1 },{ removeOnComplete: true });    
    
//         })
    
//         console.log('done')
//     } catch (error) {
//         console.log(error)
//     }
   
// }
// schedule(`*/5 * * * * *`, async() => {
//    await postDataHashTag()
//    await postDataAuthor()
// });


