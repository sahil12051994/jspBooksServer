//     Consumer = kafka.Consumer,
//     client = new kafka.KafkaClient(),
//     const client = new Client({
//         autoConnect: true,
//         kafkaHost: 'localhost' + ':9092'
//     });
//     consumer = new Consumer(
//         client,
//         [
//             { topic: 'video-stream-event'}
//         ],
//         {
//             autoCommit: false
//         }
//     );


var kafka = require('kafka-node')
const Client = kafka.KafkaClient;
const client = new Client({
  autoConnect: true,
  kafkaHost: 'localhost' + ':9092'
});


var Consumer = kafka.Consumer
var consumer = new Consumer(
  client,
  [{
    topic: 'nodeJsData'
  }], {
    fromOffset: false //false to be ideal
  }
);

var Client1 = new kafka.KafkaClient(),
    offset = new kafka.Offset(Client1);
    offset.fetch([
        { topic: 'nodeJsData', partition: 0, time: -1, maxNum: 1}
    ], function (err, data) {
      console.log(data)
        // data
        console.log(data['nodeJsData']['0'])
        consumer.setOffset('nodeJsData', 0, data['nodeJsData']['0']);
        // { 't': { '0': [999] } }
    });

// var options = {
//   kafkaHost: 'broker:9092', // connect directly to kafka broker (instantiates a KafkaClient)
//   batch: undefined, // put client batch settings if you need them
//   // ssl: true, // optional (defaults to false) or tls options hash
//   groupId: 'ExampleTestGroup',
//   sessionTimeout: 15000,
//   // An array of partition assignment protocols ordered by preference.
//   // 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
//   protocol: ['roundrobin'],
//   encoding: 'utf8', // default is utf8, use 'buffer' for binary data
//
//   // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
//   // equivalent to Java client's auto.offset.reset
//   fromOffset: 'latest', // default
//   commitOffsetsOnFirstJoin: true, // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
//   // how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
//   outOfRangeOffset: 'earliest', // default
//   // Callback to allow consumers with autoCommit false a chance to commit before a rebalance finishes
//   // isAlreadyMember will be false on the first connection, and true on rebalances triggered after that
//   onRebalance: (isAlreadyMember, callback) => { callback(); } // or null
// };
//
// // Or for a single topic pass in a string
// var consumer = new ConsumerGroup(options, 'nodeJsData');

client.on('ready', function () { console.log('client ready!') })

consumer.on('error', function (err) {
    console.log("Kafka Error: Consumer - " + err);
});

consumer.on('offsetOutOfRange', function (err) {
    console.log("offsetOutOfRange Error: Consumer - " + err);
});

consumer.on('message', function(message) {
  console.log(message);
});
