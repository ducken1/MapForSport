package com.example.booking.reservation;

import com.example.booking.reservation.Reservation;
import com.example.booking.reservation.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.Mockito.*;

class ReservationServiceTest {

    private ReservationService reservationService;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private MessageProducer messageProducer;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        reservationService = new ReservationService(reservationRepository, messageProducer);
    }

    @Test
    void testCreateReservation() {
        String reservationId = "123";
        Reservation reservation = new Reservation();
        reservation.setId(reservationId);
        reservation.setUserId("user1");
        reservation.setFacilityName("Room A");  // Use setFacilityName instead of setRoom
        reservation.setStatus("confirmed");

        // Mock repository save method to return the reservation
        when(reservationRepository.save(reservation)).thenReturn(Mono.just(reservation));

        // Mock messageProducer sendMessage method to return Mono.empty()
        when(messageProducer.sendMessage(anyString())).thenReturn(Mono.empty());

        // StepVerifier to test the flow of reservation creation
        StepVerifier.create(reservationService.createReservation(reservation))
                .expectNextMatches(res -> res.getId().equals(reservationId))
                .verifyComplete();

        // Verify that the sendMessage method was called once
        verify(messageProducer, times(1)).sendMessage(anyString());
    }

    @Test
    void testGetReservation() {
        String reservationId = "123";
        Reservation reservation = new Reservation();
        reservation.setId(reservationId);
        reservation.setUserId("user1");
        reservation.setFacilityName("Room A");  // Use setFacilityName instead of setRoom
        reservation.setStatus("confirmed");

        // Mock repository findById method to return the reservation
        when(reservationRepository.findById(reservationId)).thenReturn(Mono.just(reservation));

        // StepVerifier to test fetching the reservation
        StepVerifier.create(reservationService.getReservation(reservationId))
                .expectNextMatches(res -> res.getId().equals(reservationId))
                .verifyComplete();
    }

    @Test
    void testCancelReservation() {
        String reservationId = "123";

        // Mock repository deleteById method to simulate a successful deletion
        when(reservationRepository.deleteById(reservationId)).thenReturn(Mono.empty());

        // Mock messageProducer sendMessage method to return Mono.empty()
        when(messageProducer.sendMessage(anyString())).thenReturn(Mono.empty());

        // StepVerifier to test canceling the reservation
        StepVerifier.create(reservationService.cancelReservation(reservationId))
                .verifyComplete();

        // Verify that the sendMessage method was called once
        verify(messageProducer, times(1)).sendMessage(anyString());
    }
}
