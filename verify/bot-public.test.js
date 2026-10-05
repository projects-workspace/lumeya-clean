'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function fixture({storageError=false,sendError=false}={}) {
  const calls=[];let insert;
  const handlers={};
  class Bot {
    constructor(){this.telegram={sendMessage:async(...args)=>{calls.push(['send',...args]);if(sendError)throw new Error('test_send_failed');}};}
    use(){} start(fn){handlers.start=fn;} on(name,fn){handlers[name]=fn;}
    launch(){return Promise.resolve();} stop(){}
  }
  const db={from(table){calls.push(['table',table]);return {
    insert(record){insert=record;return {select(){return {async single(){return {data:storageError?null:{id:'test-receipt'},error:storageError?new Error('test_store_failed'):null};}};}};},
    update(patch){calls.push(['update',patch]);return {async eq(){return {error:null};}};}
  };},async rpc(name,args){calls.push(['rpc',name,args]);return {data:[{id:'test-queued',request_type:'looking_for',subject:'Local worker test',details:'Local isolation only',contact:'test@example.invalid'}],error:null};}};
  const context={console:{log(){},error(){}},URL,setTimeout(){},setInterval(){},process:{env:{BOT_TOKEN:'test-only',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only',ADMIN_CHAT_ID:'12345',PUBLIC_SITE_URL:'https://example.invalid',PUBLIC_REQUEST_POLL_MS:'0'},once(){},exit(){throw new Error('unexpected_exit');}},require(name){if(name==='dotenv')return {config(){}};if(name==='telegraf')return {Telegraf:Bot,session:()=>()=>{}};if(name==='@supabase/supabase-js')return {createClient:()=>db};if(name==='crypto')return require('node:crypto');throw new Error('unexpected_dependency');}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../bot/bot.js'),'utf8'),context);
  const replies=[];const ctx={from:{id:123,first_name:'Local'},session:{state:'public_request_message'},message:{text:'Lumeya public request: looking_for\nSubject: Local safe test\nContact: test@example.invalid\nDetails:\nSynthetic local request only'},reply:async text=>replies.push(text)};
  return {context,calls,handlers,ctx,replies,get inserted(){return insert;}};
}
test('public fallback stores/notifies without creating any platform profile',async()=>{
 const f=fixture();await f.handlers.start(f.ctx);await f.handlers.text(f.ctx);
 assert.equal(f.inserted.request_type,'looking_for');assert.equal(f.inserted.source_channel,'telegram');
 assert.deepEqual(f.calls.filter(x=>x[0]==='table').map(x=>x[1]),['public_discovery_requests','public_discovery_requests']);
 assert.ok(f.replies.includes('Thank you. Your request has been received.'));assert.equal(f.ctx.session,null);
});
test('fallback retains delivery recovery and truthful total-failure behavior',async()=>{
 const recovered=fixture({storageError:true});await recovered.handlers.text(recovered.ctx);assert.match(recovered.replies.at(-1),/received/);
 const failed=fixture({storageError:true,sendError:true});await failed.handlers.text(failed.ctx);assert.match(failed.replies.at(-1),/could not deliver/);assert.ok(failed.ctx.session);
});
test('worker claims only public requests and updates notified/failed state',async()=>{
 for(const sendError of [false,true]){const f=fixture({sendError});await vm.runInContext('processPublicDiscoveryRequests()',f.context);
 assert.deepEqual(f.calls.filter(x=>x[0]==='rpc').map(x=>x[1]),['claim_public_discovery_requests']);
 assert.ok(f.calls.some(x=>x[0]==='update'&&x[1].notification_status===(sendError?'failed':'notified')));
 assert.ok(f.calls.filter(x=>x[0]==='table').every(x=>x[1]==='public_discovery_requests'));}
});
test('invalid fallback does not write or send',async()=>{const f=fixture();f.ctx.message.text='short';await f.handlers.text(f.ctx);assert.equal(f.calls.length,0);assert.match(f.replies.at(-1),/at least 10/);});
