import mongoose from 'mongoose';
const {Schema,model} = mongoose;


const profileSchema = new Schema({
    cid:String,
    aweme_id:String,
    siteId:String,
    siteName:String,
    description:String,
    parentDate:String,
    parentId:String,
    urlPost:String,
}, { versionKey: false })
export default model('queuecommentreply',profileSchema);
