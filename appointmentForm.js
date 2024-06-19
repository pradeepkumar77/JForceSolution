import { LightningElement, track, wire } from 'lwc';
import getAvailableSlots from '@salesforce/apex/AppointmentController.getAvailableSlots';
import saveAppointmentDetails from '@salesforce/apex/AppointmentController.saveAppointmentDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AppointmentForm extends LightningElement {
    @track appointmentSlots = [];
    @track contactId = '';
    @track subject = '';
    @track appointmentDate = '';
    @track appointmentTime = '';
    @track description = '';

    @wire(getAvailableSlots)
    wiredSlots({ data, error }) {
        if (data) {
            this.appointmentSlots = data;
        } else if (error) {
            this.showToast('Error', 'Failed to fetch appointment slots', 'error');
        }
    }

    handleContactChange(event) {
        this.contactId = event.detail.value[0];
    }

    handleSubjectChange(event) {
        this.subject = event.target.value;
    }

    handleDateChange(event) {
        this.appointmentDate = event.target.value;
    }

    handleTimeChange(event) {
        this.appointmentTime = event.target.value;
    }

    handleDescriptionChange(event) {
        this.description = event.target.value;
    }

    validateForm() {
        return this.contactId && this.subject && this.appointmentDate && this.appointmentTime && this.description;
    }

    handleSubmit() {
        if (!this.validateForm()) {
            this.showToast('Error', 'Please fill all the fields', 'error');
            return;
        }

        const selectedSlot = this.appointmentSlots.find(slot => slot.Appointment_Date__c === this.appointmentDate);
        if (!selectedSlot) {
            this.showToast('Error', 'Selected date is not available', 'error');
            return;
        }

        const { Start_Time__c, End_Time__c } = selectedSlot;
        if (this.appointmentTime > Start_Time__c || this.appointmentTime < End_Time__c) {
            this.showToast('Error', 'Selected time is not within the available slot', 'error');
            return;
        }

        // Convert appointmentTime to 12-hour format with AM/PM
        const [hours, minutes] = this.appointmentTime.split(':');
        let hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) {
            hour -= 12;
        } else if (hour === 0) {
            hour = 12;
        }
        const formattedTime = `${hour}:${minutes}:00 ${period}`;

        saveAppointmentDetails({
            contactId: this.contactId,
            subject: this.subject,
            appointmentDate: this.appointmentDate,
            appointmentTime: formattedTime,
            description: this.description
        })
        .then(() => {
            this.showToast('Success', 'Appointment booked successfully', 'success');
            this.clearForm();
        })
        .catch(error => {
            this.showToast('Error', `Failed to book appointment: ${error.body.message}`, 'error');
        });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(event);
    }

    clearForm() {
        this.contactId = '';
        this.subject = '';
        this.appointmentDate = '';
        this.appointmentTime = '';
        this.description = '';
    }
}
