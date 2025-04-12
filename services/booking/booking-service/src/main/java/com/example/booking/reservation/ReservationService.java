package com.example.booking.reservation;

import com.example.booking.reservation.Reservation;
import com.example.booking.reservation.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ReservationService {

    private static final Logger logger = LoggerFactory.getLogger(ReservationService.class);

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private MessageProducer messageProducer;  // Add message producer for event publishing

    public ReservationService(ReservationRepository reservationRepository, MessageProducer messageProducer) {
        this.reservationRepository = reservationRepository;
        this.messageProducer = messageProducer;
    }

    public Mono<Reservation> createReservation(Reservation reservation) {
        logger.info("Creating reservation for user: {}", reservation.getUserId());
        return reservationRepository.save(reservation)
            .doOnSuccess(saved -> {
                logger.info("Created reservation with ID: {}", saved.getId());
                // Send message about the created reservation
                messageProducer.sendMessage("Created reservation with ID: " + saved.getId())
                        .doOnSuccess(ignored -> logger.info("Sent message for created reservation"))
                        .subscribe();
            })
            .doOnError(error -> logger.error("Error creating reservation", error));
    }

    public Mono<Reservation> getReservation(String id) {
        logger.info("Fetching reservation with ID: {}", id);
        return reservationRepository.findById(id)
            .doOnSuccess(reservation -> logger.info("Retrieved reservation: {}", reservation))
            .doOnError(error -> logger.error("Error fetching reservation with ID: {}", id, error));
    }

    public Mono<Void> cancelReservation(String id) {
        logger.info("Cancelling reservation with ID: {}", id);
        return reservationRepository.deleteById(id)
            .doOnSuccess(ignored -> {
                logger.info("Cancelled reservation with ID: {}", id);
                // Send message about the canceled reservation
                messageProducer.sendMessage("Cancelled reservation with ID: " + id)
                        .doOnSuccess(ignoredMsg -> logger.info("Sent message for canceled reservation"))
                        .subscribe();
            })
            .doOnError(error -> logger.error("Error cancelling reservation", error));
    }
}
