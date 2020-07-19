import sys
import base64
from kafka import KafkaProducer
from json import dumps
import json
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    'nodeJsData',
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )

for message in consumer:
    print(message)
app.main()
