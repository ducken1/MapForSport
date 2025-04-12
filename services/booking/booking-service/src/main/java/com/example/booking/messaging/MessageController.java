package com.example.booking.messaging;

import com.example.booking.messaging.MessageProducer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class MessageController {
    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);

    private final MessageProducer messageProducer;

    public MessageController(MessageProducer messageProducer) {
        this.messageProducer = messageProducer;
    }

    @GetMapping("/send")
    public Mono<String> sendMessage() {
        logger.info("GET request received to send a test message");
        messageProducer.sendMessage("Hello from Spring Boot Reactive!")
                .doOnTerminate(() -> logger.info("Message sent successfully"))
                .subscribe();
        return Mono.just("Message sent");
    }
}
