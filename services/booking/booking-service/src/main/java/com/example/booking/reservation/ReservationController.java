package com.example.booking.reservation;

import com.example.booking.reservation.Reservation;
import com.example.booking.reservation.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/reservations")
public class ReservationController {

    private static final Logger logger = LoggerFactory.getLogger(ReservationController.class);

    @Autowired
    private ReservationService reservationService;

    @PostMapping
    public Mono<Reservation> createReservation(@RequestBody Reservation reservation) {
        logger.info("POST /reservations - Creating reservation");
        return reservationService.createReservation(reservation);
    }

    @GetMapping("/{id}")
    public Mono<Reservation> getReservation(@PathVariable String id) {
        logger.info("GET /reservations/{} - Fetching reservation", id);
        return reservationService.getReservation(id);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> cancelReservation(@PathVariable String id) {
        logger.info("DELETE /reservations/{} - Cancelling reservation", id);
        return reservationService.cancelReservation(id);
    }
}
