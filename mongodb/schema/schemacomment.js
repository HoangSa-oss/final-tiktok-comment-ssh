import mongoose from 'mongoose';
const {Schema,model} = mongoose;


const profileSchema = new Schema({
    id :String  ,                                       
    type : String ,
    index : String ,
    siteId : String ,
    siteName : String ,
    insertedDate: String ,
    publishedDate : String ,
    url : String ,
    author : String ,
    authorId : String ,
    title :String ,                                                
    description:String ,
    content : String ,
    parentDate : String ,
    parentId : String ,
    likes : Number,
    shares : Number ,
    comments :Number ,
    interactions: Number ,
    delayMongo : String ,
    delayEs : String ,
    delayCrawler :String ,
}, { versionKey: false })
export default model('comment',profileSchema);
