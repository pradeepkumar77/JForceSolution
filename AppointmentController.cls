public with sharing class AppointmentController {
    @AuraEnabled(cacheable=true)
    public static List<Appointment_Slots__c> getAvailableSlots() {
        return [SELECT Id, Appointment_Date__c, Start_Time__c, End_Time__c FROM Appointment_Slots__c WHERE isActive__c = true];
    }

    @AuraEnabled
    public static void saveAppointmentDetails(String contactId, String subject, Date appointmentDate, String appointmentTime, String description) {
        try {
            Time timeValue = convertToTime(appointmentTime);
            
            Appointment_Details__c newAppointment = new Appointment_Details__c();
            newAppointment.Contact__c = contactId;
            newAppointment.Subject__c = subject;
            newAppointment.Appointment_Date__c = appointmentDate;
            newAppointment.Appointment_Time__c = timeValue;
            newAppointment.Description__c = description;
            insert newAppointment;
        } catch (Exception e) {
            throw new AuraHandledException('Error while saving appointment details: ' + e.getMessage());
        }
    }

    private static Time convertToTime(String timeString) {
        // Convert 'hh:mm:ss AM/PM' to Time data type
        String[] timeParts = timeString.split(' ');
        String[] hhmmss = timeParts[0].split(':');
        Integer hour = Integer.valueOf(hhmmss[0]);
        Integer minute = Integer.valueOf(hhmmss[1]);
        Integer second = Integer.valueOf(hhmmss[2]);

        if (timeParts[1] == 'PM' && hour < 12) {
            hour += 12;
        } else if (timeParts[1] == 'AM' && hour == 12) {
            hour = 0;
        }

        return Time.newInstance(hour, minute, second, 0);
    }
}
