"use strict";
var Reservation = (function () {
    function Reservation() {
    }
    return Reservation;
}());
exports.Reservation = Reservation;
var Ticket = (function () {
    function Ticket(values) {
        this.amount = 0;
        Object.assign(this, values);
    }
    return Ticket;
}());
exports.Ticket = Ticket;
