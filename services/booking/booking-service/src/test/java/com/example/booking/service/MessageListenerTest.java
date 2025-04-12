package com.example.booking.reservation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class MessageListenerTest {

    private MessageListener messageListener;

    @Mock
    private MessageProducer messageProducer;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        messageListener = new MessageListener(messageProducer);  // Constructor with MessageProducer
    }

    @Test
    void testReceiveMessage() {
        String message = "Test message from RabbitMQ";

        // Use when().thenReturn() for methods that return values like Mono
        when(messageProducer.sendMessage(anyString())).thenReturn(Mono.empty());  // Assuming sendMessage returns a Mono

        Mono<Void> result = messageListener.receiveMessage(message);

        StepVerifier.create(result)
                .verifyComplete();  // Verifying the result completes successfully

        // Check if the message producer was NOT invoked in this test
        verify(messageProducer, times(1)).sendMessage(anyString());
    }

}
