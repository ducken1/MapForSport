package com.example.booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import com.example.booking.config.RabbitConfig;
import reactor.core.publisher.Mono;

@Service
public class MessageListener {
    private static final Logger logger = LoggerFactory.getLogger(MessageListener.class);


    private final MessageProducer messageProducer;

    // Constructor accepting MessageProducer123
    public MessageListener(MessageProducer messageProducer) {
        this.messageProducer = messageProducer;
    }

    @RabbitListener(queues = RabbitConfig.QUEUE_NAME)
    public Mono<Void> receiveMessage(String message) {
        logger.info("Received message from RabbitMQ: {}", message);
        return Mono.fromRunnable(() -> {
            try {
                // Tukaj bi lahko implementirali logiko obdelave sporočil
                logger.debug("Processing received message: {}", message);
                messageProducer.sendMessage("Processed: " + message);
            } catch (Exception e) {
                logger.error("Error processing received message", e);
            }
        });
    }
}
