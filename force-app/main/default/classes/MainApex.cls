public with sharing class MainApex {
    @AuraEnabled
    public static DateTime handleAttendance(Boolean punchOutClicked, Boolean WFHClicked){ 
        String loggedInUserId = UserInfo.getuserId();
        Employee__c emp = [SELECT Id, Employee_Name__c, Status__c FROM Employee__c 
                          WHERE User__c = :loggedInUserId LIMIT 1];
        if(emp == null){
            System.debug('No employee, attached to the current user, is Present.');
            return null;
        }

        emp.Status__c = 'Present';

        DateTime currentDTime = DateTime.now();

        Attendance__c att = attendanceRetrieval(emp.Id);

        if (att == null){ 
            Monthly_Attendance__c monthlyAttendance = monthlyAttendanceRetrieval(emp.Id, currentDTime.month(), currentDTime.year());

            if(monthlyAttendance == null){
                Date monthStart = Date.today().toStartOfMonth();
                Date monthEnd = Date.today().toStartOfMonth().addMonths(1).addDays(-1);
                
                Integer totalWeekends = 0;
                for(Date varDate = monthStart; varDate <=monthEnd; varDate=varDate.addDays(1)){
                    Integer dayOfWeek = varDate.day();
                    if(dayOfWeek == 1 || dayOfWeek == 7){
                        totalWeekends++;
                    }
                }
                Integer totalHolidays = [SELECT COUNT() FROM Holiday__c
                                        WHERE Holiday_Date__c >= :monthStart
                                        AND Holiday_Date__c <= :monthEnd
                                        AND (DAY_IN_WEEK(Holiday_Date__c) != 1
                                        AND DAY_IN_WEEK(Holiday_Date__c) != 7)];
                monthlyAttendance = new Monthly_Attendance__c(Employee_Id__c = emp.Id, Month__c = currentDTime.month(),
                                                              Year__c = currentDTime.year(), 
                                                              Start_date__c = monthStart, 
                                                              End_date__c =  monthEnd,
                                                              Holidays__c = totalHolidays ,
                                                              Weekends__c  =  totalWeekends*2); 
                insert monthlyAttendance;
                
            }
            
            att = new Attendance__c(Employee__c = emp.Id, 
                                    Monthly_Attendance__c = monthlyAttendance.Id,
                                    Punch_In__c = currentDTime, Date__c = Date.today());
            if(WFHClicked){
                att.Work_From_Home__c = true;
                emp.Status__c = 'Working From Home';
            }
            insert att;
            
        } else {
            if (punchOutClicked) {
                att.Punch_Out__c = currentDTime;
                emp.Status__c = 'Absent';
            }
            update att;
        }
        update emp;
        return currentDTime;
    }
    @AuraEnabled
    public static Attendance__c attendanceRetrieval(Id empId){
        Datetime timeStart = DateTime.newInstance(Date.today(), Time.newInstance(0, 0, 0, 0));
        Datetime timeEnd = DateTime.newInstance(Date.today(), Time.newInstance(23, 59, 59, 999));

        List<Attendance__c> record = [SELECT Id, Punch_In__c, Punch_Out__c FROM Attendance__c
                                    WHERE Employee__c = :empId AND Punch_In__c >= :timeStart
                                    AND Punch_in__c <= :timeEnd LIMIT 1];
        
        return record.isEmpty() ? null : record[0];
    }
    
    public static Monthly_Attendance__c monthlyAttendanceRetrieval(Id empId, Integer month, Integer year){
        List<Monthly_Attendance__c> record = [SELECT Id FROM Monthly_Attendance__c 
                                            WHERE Employee_Id__c = :empId AND Month__c = :month
                                            AND Year__c = :year LIMIT 1];
        return record.isEmpty() ? null : record[0];
    }

    @AuraEnabled
    public static List<Employee__c> getEmployeesByStatus(String status){
        return[SELECT id, Name, Employee_Name__c FROM Employee__c
                WHERE Status__c = :status];
    }

    @AuraEnabled
    public static Map<String, DateTime> cosistentItems(){
        try {
            Map<String, DateTime> attendanceTimes = new Map<String, DateTime>();

            String loggedInUserId = UserInfo.getuserId();
       
            Employee__c employee = [SELECT Id, Employee_Name__c FROM Employee__c WHERE User__c = :loggedInUserId LIMIT 1];
            if (employee == null) {
                System.debug('Employee not found for the current user.');
                return null; 
            }

            DateTime startOfDay = DateTime.newInstance(Date.today(), Time.newInstance(0, 0, 0, 0)); 
            DateTime endOfDay = DateTime.newInstance(Date.today(), Time.newInstance(23, 59, 59, 999)); 

            List<Attendance__c> existingAttendance = [SELECT Id, Punch_In__c, Punch_Out__c 
                                                      FROM Attendance__c 
                                                      WHERE Employee__c = :employee.Id 
                                                      AND Punch_In__c >= :startOfDay 
                                                      AND Punch_In__c <= :endOfDay 
                                                      LIMIT 1];
        
            if (!existingAttendance.isEmpty()) {
                attendanceTimes.put('punchIn', (existingAttendance[0].Punch_In__c));
                attendanceTimes.put('punchOut', existingAttendance[0].Punch_Out__c);
            }
            System.debug(attendanceTimes);
            return attendanceTimes;
            } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
            }
    }
}