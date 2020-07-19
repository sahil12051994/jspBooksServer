#!/bin/bash -e

#screen -dmS kafka
#screen -dmS videoAcq
#screen -dmS consumer
#screen -dmS processStream
#screen -dmS modelServer

screen -dmS zooKeeper bash -c 'cd /home/hercules/Downloads/zookeeper-3.4.9/bin && sudo ./zkServer.sh start';
echo Started zooKeeper

echo 5 Sec halt for starting zooKeeper
sleep 5

screen -dmS kafka bash -c 'cd /home/hercules/Downloads/kafka_2.12-2.2.0/bin && sudo ./kafka-server-start.sh ../config/server.properties';
echo Started Kafka

echo 10 Sec halt for starting kafka
sleep 10

partitions=$(bash -c 'cd /home/hercules/Downloads/kafka_2.12-2.2.0/bin/ && ./kafka-topics.sh --describe --topic VideoStream_zero_two --zookeeper localhost:2181' | wc -l);
echo "$partitions";
if [ $partitions -eq 151 ]
then
    echo "Already have partitions"
else
    bash -c 'cd /home/hercules/Downloads/kafka_2.12-2.2.0/bin && ./kafka-topics.sh --alter --zookeeper localhost:2181 --topic VideoStream_zero_two --partitions 150';
    echo Changed Kafka Partitions
fi

screen -dmS videoAcq bash -c 'cd /home/hercules/Code_files/utils_ob && source activate vidana && python video_acq.py';
echo Started Video Acq

partitions2=$(bash -c 'cd /home/hercules/Downloads/kafka_2.12-2.2.0/bin/ && ./kafka-topics.sh --describe --topic PeopleDetection_zero_two --zookeeper localhost:2181' | wc -l);
echo "$partitions2";
if [ $partitions2 -eq 3 ]
then
    echo "Already have partitions"
elif [ $partitions2 -eq 1 ]
then
     bash -c 'cd /home/hercules/Downloads/kafka_2.12-2.2.0/bin && ./kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 2 --topic PeopleDetection_zero_two';
    echo Created Kafka Topic
else
    bash -c 'cd /home/hercules/Downloads/kafka_2.12-2.2.0/bin && ./kafka-topics.sh --alter --zookeeper localhost:2181 --topic PeopleDetection_zero_two --partitions 2';
    echo Changed Kafka Partitions
fi

screen -dmS consumer bash -c "cd /home/hercules/Code_files/ && source activate vidana && python stream_process_consumer.py";
echo Started Consumer

screen -dmS processStream bash -c 'cd /home/hercules/Ritesh/AlphaPose-Mxnet && source activate mxnet && faust -A mystream worker -p 6066 -l info';
echo Started Processing

screen -dmS processStream2 bash -c 'cd /home/hercules/Ritesh/AlphaPose-Mxnet && source activate mxnet && faust -A mystream2 worker -p 6067 -l info';
echo Started Processing2

screen -dmS modelServer bash -c 'cd /home/hercules/aiProject/modelServer && python manage.py runserver 8082';
echo Started Django Model Server

echo 5 Sec halt
sleep 10

bash -c 'cd /home/hercules/aiProject/dashboard/JBM_Dashboard && sudo pm2 start ecosystem.config.js';
echo Started Dashboard Server

screen -dmS realtime bash -c 'cd /home/hercules/aiProject/AI_Server && npm start';
echo Started Realtime Server
