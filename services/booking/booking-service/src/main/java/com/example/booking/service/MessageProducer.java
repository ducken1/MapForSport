package com.example.booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class MessageProducer {
    private static final Logger logger = LoggerFactory.getLogger(MessageProducer.class);

    private final AmqpTemplate amqpTemplate;

    @Value("${rabbitmq.exchange.name:myExchange}")
    private String exchangeName;

    @Value("${rabbitmq.routing.key.name:myRoutingKey}")
    private String routingKey;

    public MessageProducer(AmqpTemplate amqpTemplate) {
        this.amqpTemplate = amqpTemplate;
    }

    public Mono<Void> sendMessage(String message) {
        logger.info("Sending message to RabbitMQ: {}", message);
        return Mono.fromRunnable(() -> {
            try {
                amqpTemplate.convertAndSend(exchangeName, routingKey, message);
                logger.debug("Message sent successfully to exchange: {} with routing key: {}", exchangeName, routingKey);
            } catch (Exception e) {
                logger.error("Failed to send message to RabbitMQ", e);
            }
        });
    }


}
