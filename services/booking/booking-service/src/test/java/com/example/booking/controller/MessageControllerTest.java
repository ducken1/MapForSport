package com.example.booking.controller;

import com.example.booking.service.MessageProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import static org.mockito.Mockito.*;

class MessageControllerTest {

    @InjectMocks
    private MessageController messageController;

    @Mock
    private MessageProducer messageProducer;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSendMessage() {
        String message = "Hello from Spring Boot Reactive!";

        // If sendMessage returns Mono<Void>, we mock it accordingly
        when(messageProducer.sendMessage(message)).thenReturn(Mono.empty());  // Mock return of Mono.empty()

        Mono<String> result = messageController.sendMessage();

        StepVerifier.create(result)
                .expectNext("Message sent")
                .verifyComplete();

        verify(messageProducer, times(1)).sendMessage(message);
    }
}
