rabbitmq-plugins enable rabbitmq_management;
service rabbitmq-server start;
rabbitmqctl add_user pi pi;
rabbitmqctl set_user_tags pi;
rabbitmqctl set_permissions -p / pi ".*" ".*" ".*"