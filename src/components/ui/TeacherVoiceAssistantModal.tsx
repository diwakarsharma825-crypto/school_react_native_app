import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { Brand, Radius, Spacing } from '@/constants/theme';
import {
  ApiSyllabusChapter,
  AttendanceStudent,
  fetchAttendance,
  fetchHomeworkForDate,
  fetchSyllabusApi,
  fetchSubjectsCatalog,
  fetchTeacherEvents,
  fetchTeacherFeeInvoices,
  fetchTeacherLeaveApplications,
  fetchTeacherNotices,
  fetchTeacherStudents,
  fetchTeacherSubjects,
  HomeworkEntry,
  MappedSubjectItem,
  RosterStudent,
  SubjectCatalogItem,
  TeacherEvent,
  TeacherFeeInvoice,
  TeacherLeaveApplication,
  TeacherNotice,
  TeacherProfileClass,
} from '@/data/teacher-api';
import { useTheme } from '@/hooks/use-theme';

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

interface QueryResultData {
  type:
    | 'attendance'
    | 'roster'
    | 'leave'
    | 'fees'
    | 'fee_paid'
    | 'fee_unpaid'
    | 'homework'
    | 'subjects'
    | 'syllabus'
    | 'notices'
    | 'events'
    | 'student_detail'
    | 'gender'
    | 'all_classes'
    | 'error';
  title: string;
  summaryText: string;
  className: string;
  sectionName?: string;
  stats?: { label: string; value: string | number; color: string }[];
  studentsList?: { name: string; rollNo?: string | null; srn?: string | null; status?: string }[];
  leaveList?: { studentName: string; dates: string; reason: string; status: string }[];
  feeList?: { studentName: string; title: string; amount: string; status: string }[];
  homeworkList?: { subject: string; title: string; date: string }[];
  subjectsList?: { name: string; code?: string }[];
  syllabusList?: { chapterNumber: number; title: string; subject: string; completed: boolean; topics?: string[] }[];
  noticeList?: { title: string; body: string; date?: string; status?: string }[];
  eventList?: { title: string; date?: string; description?: string; location?: string }[];
  studentDetail?: {
    name: string;
    rollNo?: string | null;
    srn?: string | null;
    className: string;
    sectionName?: string | null;
    fatherName?: string | null;
    motherName?: string | null;
    phone?: string | null;
    gender?: string | null;
    status?: string | null;
  };
  classList?: { className: string; sectionName?: string; studentCount: number }[];
  errorMessage?: string;
}

interface TeacherVoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  teacherClasses: TeacherProfileClass[];
  currentClassId?: number;
  currentSectionId?: number;
}

export function TeacherVoiceAssistantModal({
  visible,
  onClose,
  teacherClasses,
  currentClassId,
  currentSectionId,
}: TeacherVoiceAssistantModalProps) {
  const theme = useTheme();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [queryText, setQueryText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<QueryResultData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Web Recognition ref & Native WebView ref
  const recognitionRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  function stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  function handleClose() {
    stopSpeech();
    stopListening();
    onClose();
  }

  useEffect(() => {
    if (visible) {
      setTranscript('');
      setQueryText('');
      setResult(null);
    } else {
      stopSpeech();
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function speakText(text: string) {
    stopSpeech();
    if (!soundEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore audio errors
      }
    }
  }

  async function requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission Needed',
            message: 'Teacher Voice AI requires access to your microphone to speak queries.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    return true;
  }

  async function startListening() {
    stopSpeech();
    setResult(null);
    setTranscript('');

    if (Platform.OS === 'android') {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone permission in device Settings to use Voice Assistant.'
        );
        return;
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (recognitionRef.current) {
            recognitionRef.current.abort();
          }
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          let lastTranscript = '';

          recognition.onstart = () => {
            setListening(true);
          };

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current) {
              lastTranscript = current;
              setTranscript(current);
              setQueryText(current);
            }
          };

          recognition.onerror = (event: any) => {
            setListening(false);
            if (event.error !== 'no-speech') {
              Alert.alert('Voice Recognition Error', `Speech error: ${event.error}`);
            }
          };

          recognition.onend = () => {
            setListening(false);
            const textToSearch = lastTranscript.trim();
            if (textToSearch) {
              processVoiceQuery(textToSearch);
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch {
          // fallback below
        }
      }
    }

    // Native Mobile WebView Speech Bridge
    if (webViewRef.current) {
      setListening(true);
      webViewRef.current.injectJavaScript('startRec(); true;');
    } else {
      setListening(true);
    }
  }

  function stopListening() {
    setListening(false);
    if (Platform.OS === 'web' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (webViewRef.current) {
      try {
        webViewRef.current.injectJavaScript('stopRec(); true;');
      } catch {
        // ignore
      }
    }
  }

  function handleMicPress() {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function handleWebViewMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'start') {
        setListening(true);
      } else if (data.type === 'result') {
        const text = data.transcript || '';
        setTranscript(text);
        setQueryText(text);
      } else if (data.type === 'end') {
        setListening(false);
        const textToSearch = (data.finalTranscript || queryText || transcript).trim();
        if (textToSearch) {
          processVoiceQuery(textToSearch);
        }
      } else if (data.type === 'error') {
        setListening(false);
      }
    } catch {
      // ignore
    }
  }

  // Strict Security & Class Scoping Helper
  function resolveTargetClass(prompt: string): {
    matchedClass: TeacherProfileClass | null;
    isAuthorized: boolean;
    requestedClassName: string;
  } {
    const p = prompt.toLowerCase();

    // Check all teacher's assigned classes first
    for (const cls of teacherClasses) {
      const cName = cls.class_name.toLowerCase();
      const sName = (cls.section_name || '').toLowerCase();
      const fullLabel = `${cName} ${sName}`.trim();
      const sectionLabel = `section ${sName}`.trim();

      if (
        p.includes(fullLabel) ||
        (p.includes(cName) && sName && p.includes(sName)) ||
        (p.includes(cName) && p.includes(sectionLabel)) ||
        p.includes(cName)
      ) {
        return { matchedClass: cls, isAuthorized: true, requestedClassName: cls.class_name };
      }
    }

    // If prompt mentions a class that is NOT in teacher's assigned classes
    const knownClassPatterns = [
      'nursery',
      'lkg',
      'ukg',
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
      '10th',
      '11th',
      '12th',
      'class 1',
      'class 2',
      'class 3',
      'class 4',
      'class 5',
      'class 6',
      'class 7',
      'class 8',
      'class 9',
      'class 10',
    ];
    for (const pattern of knownClassPatterns) {
      if (p.includes(pattern)) {
        const requestedName = pattern.toUpperCase();
        return { matchedClass: null, isAuthorized: false, requestedClassName: requestedName };
      }
    }

    // If no specific class is mentioned in prompt, default to current active class or first assigned class
    const defaultCls =
      teacherClasses.find((c) => c.class_id === currentClassId) || teacherClasses[0] || null;

    return {
      matchedClass: defaultCls,
      isAuthorized: defaultCls !== null,
      requestedClassName: defaultCls ? defaultCls.class_name : 'Assigned Class',
    };
  }

  async function processVoiceQuery(rawPrompt: string) {
    const prompt = rawPrompt.trim();
    if (!prompt) return;

    stopSpeech(); // Stop existing speech output immediately when sending new query
    setProcessing(true);
    stopListening();

    try {
      const pLower = prompt.toLowerCase();

      // 0. All Assigned Classes Summary Query
      if (
        pLower.includes('all my classes') ||
        pLower.includes('all classes') ||
        pLower.includes('overview') ||
        pLower.includes('summary of my classes')
      ) {
        let totalAllStudents = 0;
        const classBreakdown: { className: string; sectionName?: string; studentCount: number }[] = [];

        for (const cls of teacherClasses) {
          const classStudents = await fetchTeacherStudents(
            cls.class_id,
            cls.section_id ?? undefined
          ).catch(() => [] as RosterStudent[]);
          totalAllStudents += classStudents.length;
          classBreakdown.push({
            className: cls.class_name,
            sectionName: cls.section_name ?? undefined,
            studentCount: classStudents.length,
          });
        }

        const summary = `You manage ${teacherClasses.length} class sections with a total of ${totalAllStudents} students across all sections.`;
        setResult({
          type: 'all_classes',
          title: `All Assigned Classes Overview (${teacherClasses.length} Sections)`,
          summaryText: summary,
          className: 'All Classes',
          stats: [
            { label: 'Total Sections', value: teacherClasses.length, color: '#7C3AED' },
            { label: 'Total Students', value: totalAllStudents, color: '#3B82F6' },
          ],
          classList: classBreakdown,
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // Resolve class & authorization security
      const { matchedClass, isAuthorized, requestedClassName } = resolveTargetClass(prompt);

      if (!isAuthorized || !matchedClass) {
        const assignedLabels = teacherClasses
          .map((c) => `${c.class_name}${c.section_name ? ` - ${c.section_name}` : ''}`)
          .join(', ');
        const errorMsg = `🔒 Access Restricted: You are assigned to (${assignedLabels || 'your assigned class'}). You cannot access data for ${requestedClassName}.`;
        const res: QueryResultData = {
          type: 'error',
          title: 'Access Restricted',
          summaryText: errorMsg,
          className: requestedClassName,
          errorMessage: errorMsg,
        };
        setResult(res);
        speakText(`Access restricted. You can only query data for your assigned classes.`);
        setProcessing(false);
        return;
      }

      const classId = matchedClass.class_id;
      const sectionId = matchedClass.section_id ?? undefined;
      const classDisplayName = `${matchedClass.class_name}${
        matchedClass.section_name ? ` Section ${matchedClass.section_name}` : ''
      }`;

      // Fetch roster for target class
      const classStudents = await fetchTeacherStudents(classId, sectionId).catch(
        () => [] as RosterStudent[]
      );

      // 1. ROLL NUMBER SEARCH QUERY
      const rollMatch =
        pLower.match(/(?:roll\s*(?:no\.?|number)?\s*|roll\s+)(\d+)/i) ||
        pLower.match(/\broll\b.*?(\d+)/i);

      if (rollMatch) {
        const requestedRoll = rollMatch[1];
        const matchedRollStudent = classStudents.find(
          (s) =>
            s.roll_no &&
            (String(s.roll_no).trim() === requestedRoll || Number(s.roll_no) === Number(requestedRoll))
        );

        if (matchedRollStudent) {
          const attendanceData = await fetchAttendance(classId, sectionId, todayStr()).catch(
            () => [] as AttendanceStudent[]
          );
          const attRecord = attendanceData.find(
            (a) =>
              String(a.id) === String(matchedRollStudent.id) ||
              a.name.toLowerCase() === matchedRollStudent.name.toLowerCase()
          );
          const attStatus = attRecord
            ? attRecord.status === 'P'
              ? 'PRESENT'
              : attRecord.status === 'A'
              ? 'ABSENT'
              : 'ON LEAVE'
            : 'NOT MARKED YET';

          const summary = `Found Roll No ${requestedRoll}: ${matchedRollStudent.name} in ${classDisplayName}. Today's Attendance: ${attStatus}. Father: ${
            matchedRollStudent.father_name || 'N/A'
          }, Phone: ${matchedRollStudent.phone || 'N/A'}.`;

          setResult({
            type: 'student_detail',
            title: `Student Details (Roll No: ${requestedRoll})`,
            summaryText: summary,
            className: matchedClass.class_name,
            sectionName: matchedClass.section_name ?? undefined,
            studentDetail: {
              name: matchedRollStudent.name,
              rollNo: String(matchedRollStudent.roll_no),
              srn: matchedRollStudent.srn,
              className: matchedClass.class_name,
              sectionName: matchedClass.section_name,
              fatherName: matchedRollStudent.father_name,
              motherName: matchedRollStudent.mother_name,
              phone: matchedRollStudent.phone,
              gender: matchedRollStudent.gender,
              status: `Attendance Today: ${attStatus}`,
            },
          });
          speakText(summary);
          setProcessing(false);
          return;
        } else {
          const summary = `No student with Roll No ${requestedRoll} was found in ${classDisplayName}. Total registered students: ${classStudents.length}.`;
          setResult({
            type: 'roster',
            title: `Roll No ${requestedRoll} Not Found`,
            summaryText: summary,
            className: matchedClass.class_name,
            sectionName: matchedClass.section_name ?? undefined,
            stats: [{ label: 'Class Strength', value: classStudents.length, color: '#3B82F6' }],
            studentsList: classStudents.map((s) => ({
              name: s.name,
              rollNo: s.roll_no,
              srn: s.srn,
            })),
          });
          speakText(summary);
          setProcessing(false);
          return;
        }
      }

      // Check if prompt references a specific student by name or SRN
      const matchedStudent = classStudents.find((s) => {
        const sNameLower = s.name.toLowerCase();
        const parts = sNameLower.split(' ').filter((pt) => pt.length >= 3);
        if (pLower.includes(sNameLower)) return true;
        for (const part of parts) {
          if (
            pLower.includes(`about ${part}`) ||
            pLower.includes(`student ${part}`) ||
            pLower.includes(`is ${part}`) ||
            pLower.includes(`fee of ${part}`) ||
            pLower.includes(`detail of ${part}`) ||
            pLower.includes(part)
          ) {
            return true;
          }
        }
        if (s.srn && pLower.includes(s.srn.toLowerCase())) return true;
        return false;
      });

      // Handle queries for a SPECIFIC NAMED STUDENT
      if (matchedStudent) {
        if (
          pLower.includes('present') ||
          pLower.includes('absent') ||
          pLower.includes('attendance')
        ) {
          const attendanceData = await fetchAttendance(classId, sectionId, todayStr()).catch(
            () => [] as AttendanceStudent[]
          );
          const attRecord = attendanceData.find(
            (a) =>
              String(a.id) === String(matchedStudent.id) ||
              a.name.toLowerCase() === matchedStudent.name.toLowerCase()
          );
          const attStatus = attRecord
            ? attRecord.status === 'P'
              ? 'PRESENT'
              : attRecord.status === 'A'
              ? 'ABSENT'
              : 'ON LEAVE'
            : 'NOT MARKED YET';
          const summary = `Student ${matchedStudent.name} (Roll No: ${
            matchedStudent.roll_no || 'N/A'
          }) in ${classDisplayName} is ${attStatus} today.`;

          setResult({
            type: 'student_detail',
            title: `Today's Attendance: ${matchedStudent.name}`,
            summaryText: summary,
            className: matchedClass.class_name,
            sectionName: matchedClass.section_name ?? undefined,
            studentDetail: {
              name: matchedStudent.name,
              rollNo: matchedStudent.roll_no,
              srn: matchedStudent.srn,
              className: matchedClass.class_name,
              sectionName: matchedClass.section_name,
              fatherName: matchedStudent.father_name,
              motherName: matchedStudent.mother_name,
              phone: matchedStudent.phone,
              gender: matchedStudent.gender,
              status: `Today's Attendance: ${attStatus}`,
            },
          });
          speakText(summary);
          setProcessing(false);
          return;
        }

        if (
          pLower.includes('fee') ||
          pLower.includes('unpaid') ||
          pLower.includes('due') ||
          pLower.includes('paid')
        ) {
          const fees = await fetchTeacherFeeInvoices(classId, sectionId).catch(
            () => [] as TeacherFeeInvoice[]
          );
          const studentFees = fees.filter(
            (f) =>
              (f.student_name &&
                f.student_name.toLowerCase().includes(matchedStudent.name.toLowerCase())) ||
              (f.student_srn && matchedStudent.srn && f.student_srn === matchedStudent.srn)
          );
          const dueStudentFees = studentFees.filter((f) => f.status === 'due');
          const totalDue = dueStudentFees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
          const summary =
            dueStudentFees.length > 0
              ? `${matchedStudent.name} has ${dueStudentFees.length} unpaid fee invoice(s) totaling ₹${totalDue.toLocaleString()} in ${classDisplayName}.`
              : `No pending fee dues for ${matchedStudent.name} in ${classDisplayName}. All fees are paid!`;

          setResult({
            type: 'student_detail',
            title: `Fee Dues: ${matchedStudent.name}`,
            summaryText: summary,
            className: matchedClass.class_name,
            sectionName: matchedClass.section_name ?? undefined,
            feeList: studentFees.map((f) => ({
              studentName: matchedStudent.name,
              title: f.title,
              amount: `₹${f.amount}`,
              status: f.status.toUpperCase(),
            })),
            studentDetail: {
              name: matchedStudent.name,
              rollNo: matchedStudent.roll_no,
              srn: matchedStudent.srn,
              className: matchedClass.class_name,
              sectionName: matchedClass.section_name,
              fatherName: matchedStudent.father_name,
              phone: matchedStudent.phone,
              status:
                dueStudentFees.length > 0
                  ? `Unpaid Dues: ₹${totalDue.toLocaleString()}`
                  : 'Fee Cleared',
            },
          });
          speakText(summary);
          setProcessing(false);
          return;
        }

        const summary = `Found student ${matchedStudent.name} in ${classDisplayName}. Roll No: ${
          matchedStudent.roll_no || 'N/A'
        }, SRN: ${matchedStudent.srn || 'N/A'}. Father: ${
          matchedStudent.father_name || 'N/A'
        }, Phone: ${matchedStudent.phone || 'N/A'}.`;

        setResult({
          type: 'student_detail',
          title: `Student Profile: ${matchedStudent.name}`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          studentDetail: {
            name: matchedStudent.name,
            rollNo: matchedStudent.roll_no,
            srn: matchedStudent.srn,
            className: matchedClass.class_name,
            sectionName: matchedClass.section_name,
            fatherName: matchedStudent.father_name,
            motherName: matchedStudent.mother_name,
            phone: matchedStudent.phone,
            gender: matchedStudent.gender,
            status: matchedStudent.enrollment_status === 1 ? 'Active Student' : 'Inactive Student',
          },
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 2. UNPAID FEES / WHICH STUDENT NOT PAID FEES QUERY
      if (
        pLower.includes('not paid') ||
        pLower.includes('unpaid') ||
        pLower.includes("didn't pay") ||
        pLower.includes('who has not paid') ||
        pLower.includes('who not paid') ||
        pLower.includes('which student not paid') ||
        pLower.includes('students not paid') ||
        pLower.includes('fee pending')
      ) {
        const fees = await fetchTeacherFeeInvoices(classId, sectionId).catch(
          () => [] as TeacherFeeInvoice[]
        );
        const dueFees = fees.filter((f) => f.status === 'due');
        const totalUnpaidAmount = dueFees.reduce((acc, f) => acc + Number(f.amount || 0), 0);

        // Group unique unpaid student names
        const unpaidNames = Array.from(
          new Set(dueFees.map((f) => f.student_name || `SRN ${f.student_srn}`).filter(Boolean))
        );

        const summary =
          dueFees.length > 0
            ? `In ${classDisplayName}, ${unpaidNames.length} student(s) have unpaid fee invoices totaling ₹${totalUnpaidAmount.toLocaleString()}: ${unpaidNames.join(', ')}.`
            : `Great news! No students have unpaid fees in ${classDisplayName}. All fee invoices are cleared!`;

        setResult({
          type: 'fee_unpaid',
          title: `Unpaid Fee Students (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Unpaid Students', value: unpaidNames.length, color: '#EF4444' },
            { label: 'Pending Dues', value: `₹${totalUnpaidAmount.toLocaleString()}`, color: '#F59E0B' },
            { label: 'Total Invoices', value: dueFees.length, color: '#3B82F6' },
          ],
          feeList: dueFees.map((f) => ({
            studentName: f.student_name || `SRN ${f.student_srn}`,
            title: f.title,
            amount: `₹${f.amount}`,
            status: 'UNPAID',
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 3. TOTAL PAID FEES / HOW MUCH PAID TOTAL QUERY
      if (
        pLower.includes('how much paid') ||
        pLower.includes('total fee paid') ||
        pLower.includes('paid fee') ||
        pLower.includes('paid total') ||
        pLower.includes('total fee collected') ||
        pLower.includes('fee collection') ||
        pLower.includes('total collected') ||
        pLower.includes('amount collected')
      ) {
        const fees = await fetchTeacherFeeInvoices(classId, sectionId).catch(
          () => [] as TeacherFeeInvoice[]
        );
        const paidFees = fees.filter((f) => f.status === 'paid');
        const dueFees = fees.filter((f) => f.status === 'due');
        const totalPaidAmount = paidFees.reduce((acc, f) => acc + Number(f.amount || 0), 0);
        const totalDueAmount = dueFees.reduce((acc, f) => acc + Number(f.amount || 0), 0);

        const summary = `In ${classDisplayName}, a total of ₹${totalPaidAmount.toLocaleString()} has been collected from ${paidFees.length} paid invoice(s). Remaining unpaid dues: ₹${totalDueAmount.toLocaleString()}.`;

        setResult({
          type: 'fee_paid',
          title: `Total Fee Paid (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Total Paid', value: `₹${totalPaidAmount.toLocaleString()}`, color: '#10B981' },
            { label: 'Paid Invoices', value: paidFees.length, color: '#3B82F6' },
            { label: 'Pending Dues', value: `₹${totalDueAmount.toLocaleString()}`, color: '#EF4444' },
          ],
          feeList: paidFees.map((f) => ({
            studentName: f.student_name || `SRN ${f.student_srn}`,
            title: f.title,
            amount: `₹${f.amount}`,
            status: 'PAID',
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 4. SUBJECTS QUERY
      if (
        pLower.includes('subject') ||
        pLower.includes('subjects') ||
        pLower.includes('which subject') ||
        pLower.includes('what subject') ||
        pLower.includes('list of subjects')
      ) {
        let subjects: (MappedSubjectItem | SubjectCatalogItem)[] = await fetchTeacherSubjects(
          classId
        ).catch(() => [] as MappedSubjectItem[]);
        if (subjects.length === 0) {
          const catalog = await fetchSubjectsCatalog(classId).catch(() => [] as SubjectCatalogItem[]);
          subjects = catalog;
        }

        const subjectNames = subjects.map((s) => s.name);
        const summary =
          subjects.length > 0
            ? `In ${classDisplayName}, there are ${subjects.length} subject(s) taught: ${subjectNames.join(', ')}.`
            : `No specific subjects found for ${classDisplayName}.`;

        setResult({
          type: 'subjects',
          title: `Subjects (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [{ label: 'Total Subjects', value: subjects.length, color: '#3B82F6' }],
          subjectsList: subjects.map((s) => ({
            name: s.name,
            code: (s as MappedSubjectItem).code || (s as MappedSubjectItem).subject_code,
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 5. SYLLABUS QUERY
      if (
        pLower.includes('syllabus') ||
        pLower.includes('chapter') ||
        pLower.includes('chapters') ||
        pLower.includes('course syllabus')
      ) {
        // Detect subject name in prompt
        const knownSubjects = [
          'english',
          'mathematics',
          'math',
          'science',
          'hindi',
          'evs',
          'social',
          'computer',
        ];
        let targetSubject: string | undefined = undefined;
        for (const subj of knownSubjects) {
          if (pLower.includes(subj)) {
            targetSubject = subj;
            break;
          }
        }

        const syllabusChapters: ApiSyllabusChapter[] = await fetchSyllabusApi(
          classDisplayName,
          targetSubject
        ).catch(() => [] as ApiSyllabusChapter[]);

        const completedCount = syllabusChapters.filter((c) => c.completed || c.status === 1).length;
        const summary =
          syllabusChapters.length > 0
            ? `Found ${syllabusChapters.length} syllabus chapter(s) for ${
                targetSubject ? targetSubject.toUpperCase() : classDisplayName
              }. ${completedCount} chapter(s) completed.`
            : `No syllabus chapters recorded yet for ${
                targetSubject ? targetSubject.toUpperCase() : classDisplayName
              }.`;

        setResult({
          type: 'syllabus',
          title: `Syllabus Overview (${targetSubject ? targetSubject.toUpperCase() : classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Total Chapters', value: syllabusChapters.length, color: '#7C3AED' },
            { label: 'Completed', value: completedCount, color: '#10B981' },
            { label: 'Pending', value: syllabusChapters.length - completedCount, color: '#F59E0B' },
          ],
          syllabusList: syllabusChapters.map((c) => ({
            chapterNumber: c.chapter_number,
            title: c.chapter_title,
            subject: c.subject,
            completed: Boolean(c.completed || c.status === 1),
            topics: c.topics,
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 6. NOTICES QUERY
      if (
        pLower.includes('notice') ||
        pLower.includes('notices') ||
        pLower.includes('circular') ||
        pLower.includes('announcement') ||
        pLower.includes('school notice')
      ) {
        const notices: TeacherNotice[] = await fetchTeacherNotices().catch(
          () => [] as TeacherNotice[]
        );
        const activeNotices = notices.filter(
          (n) => n.is_view_on_web !== 0 && n.is_view_on_web !== '0'
        );

        const summary =
          activeNotices.length > 0
            ? `There are ${activeNotices.length} published school notice(s) available.`
            : `No active school notices found currently.`;

        setResult({
          type: 'notices',
          title: `School Notices (${activeNotices.length} Active)`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Active Notices', value: activeNotices.length, color: '#3B82F6' },
            { label: 'Total Published', value: notices.length, color: '#7C3AED' },
          ],
          noticeList: activeNotices.map((n) => ({
            title: n.title,
            body: n.notice,
            date: n.date ? n.date.split('T')[0] : undefined,
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 7. EVENTS QUERY
      if (
        pLower.includes('event') ||
        pLower.includes('events') ||
        pLower.includes('upcoming event') ||
        pLower.includes('activity') ||
        pLower.includes('activities') ||
        pLower.includes('calendar') ||
        pLower.includes('program')
      ) {
        const events: TeacherEvent[] = await fetchTeacherEvents().catch(() => [] as TeacherEvent[]);
        const summary =
          events.length > 0
            ? `There are ${events.length} school event(s) scheduled on calendar.`
            : `No upcoming school events scheduled right now.`;

        setResult({
          type: 'events',
          title: `School Events (${events.length} Scheduled)`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [{ label: 'Scheduled Events', value: events.length, color: '#7C3AED' }],
          eventList: events.map((e) => ({
            title: e.title,
            date: e.event_from || e.event_to,
            description: e.note ?? undefined,
            location: e.event_place ?? undefined,
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 8. GENDER RATIO & BREAKDOWN QUERY
      if (
        pLower.includes('boy') ||
        pLower.includes('girl') ||
        pLower.includes('gender') ||
        pLower.includes('male') ||
        pLower.includes('female')
      ) {
        const boysCount = classStudents.filter((s) => {
          const g = (s.gender || '').toLowerCase();
          return g === 'boy' || g === 'male' || g === 'm';
        }).length;
        const girlsCount = classStudents.filter((s) => {
          const g = (s.gender || '').toLowerCase();
          return g === 'girl' || g === 'female' || g === 'f';
        }).length;

        const summary = `In ${classDisplayName}, there are ${boysCount} Boys and ${girlsCount} Girls out of ${classStudents.length} total students.`;
        setResult({
          type: 'gender',
          title: `Gender Breakdown (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Boys', value: boysCount, color: '#3B82F6' },
            { label: 'Girls', value: girlsCount, color: '#EC4899' },
            { label: 'Total', value: classStudents.length, color: '#10B981' },
          ],
          studentsList: classStudents.map((s) => ({
            name: s.name,
            rollNo: s.roll_no,
            status: (s.gender || 'Student').toUpperCase(),
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 9. ATTENDANCE QUERY
      if (
        pLower.includes('present') ||
        pLower.includes('absent') ||
        pLower.includes('attendance')
      ) {
        const attendanceData = await fetchAttendance(classId, sectionId, todayStr()).catch(
          () => [] as AttendanceStudent[]
        );
        const presentCount = attendanceData.filter((a) => a.status === 'P').length;
        const absentCount = attendanceData.filter((a) => a.status === 'A').length;
        const leaveCount = attendanceData.filter((a) => a.status === 'L').length;
        const total = attendanceData.length;

        const summary = `In ${classDisplayName} today, ${presentCount} students are Present, ${absentCount} are Absent, and ${leaveCount} on Leave out of ${total} total students.`;

        setResult({
          type: 'attendance',
          title: `Today's Attendance (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Present', value: presentCount, color: '#10B981' },
            { label: 'Absent', value: absentCount, color: '#EF4444' },
            { label: 'Leave', value: leaveCount, color: '#F59E0B' },
            { label: 'Total', value: total, color: '#3B82F6' },
          ],
          studentsList: attendanceData.map((s) => ({
            name: s.name,
            rollNo: s.roll_no,
            status: s.status === 'P' ? 'Present' : s.status === 'A' ? 'Absent' : 'Leave',
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 10. PENDING LEAVE REQUESTS QUERY
      if (
        pLower.includes('leave') ||
        pLower.includes('leave request') ||
        pLower.includes('leave application')
      ) {
        const leaves = await fetchTeacherLeaveApplications(classId, sectionId).catch(
          () => [] as TeacherLeaveApplication[]
        );
        const pendingLeaves = leaves.filter((l) => l.status === 'pending');
        const summary = `There are ${pendingLeaves.length} pending leave requests for ${classDisplayName}.`;

        setResult({
          type: 'leave',
          title: `Leave Applications (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Pending', value: pendingLeaves.length, color: '#F59E0B' },
            { label: 'Total Applications', value: leaves.length, color: '#3B82F6' },
          ],
          leaveList: leaves.map((l) => ({
            studentName: l.student_name,
            dates: `${l.date_from} to ${l.date_to}`,
            reason: l.reason ?? '',
            status: l.status.toUpperCase(),
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 11. GENERAL FEE DUES QUERY
      if (pLower.includes('fee') || pLower.includes('due') || pLower.includes('invoice')) {
        const fees = await fetchTeacherFeeInvoices(classId, sectionId).catch(
          () => [] as TeacherFeeInvoice[]
        );
        const dueFees = fees.filter((f) => f.status === 'due');
        const totalDueAmount = dueFees.reduce((acc, f) => acc + Number(f.amount || 0), 0);
        const summary = `There are ${
          dueFees.length
        } pending fee invoices totaling ₹${totalDueAmount.toLocaleString()} for ${classDisplayName}.`;

        setResult({
          type: 'fees',
          title: `Fee Invoices (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Unpaid Invoices', value: dueFees.length, color: '#EF4444' },
            { label: 'Total Due', value: `₹${totalDueAmount.toLocaleString()}`, color: '#3B82F6' },
          ],
          feeList: dueFees.map((f) => ({
            studentName: f.student_name || `SRN ${f.student_srn}`,
            title: f.title,
            amount: `₹${f.amount}`,
            status: f.status.toUpperCase(),
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 12. HOMEWORK QUERY
      if (pLower.includes('homework') || pLower.includes('assignment')) {
        const hwList = await fetchHomeworkForDate(classId, sectionId, todayStr()).catch(
          () => [] as HomeworkEntry[]
        );
        const summary =
          hwList.length > 0
            ? `There are ${hwList.length} homework items assigned for ${classDisplayName} today.`
            : `No homework assigned for ${classDisplayName} today.`;

        setResult({
          type: 'homework',
          title: `Homework (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          homeworkList: hwList.map((h) => ({
            subject: h.subject,
            title: h.chapter || h.description || 'Assigned Homework',
            date: h.homework_date,
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 13. INACTIVE / PENDING STUDENTS QUERY
      if (
        pLower.includes('inactive') ||
        pLower.includes('unapproved') ||
        pLower.includes('pending student')
      ) {
        const inactiveStudents = classStudents.filter((s) => s.enrollment_status === 0);
        const summary =
          inactiveStudents.length > 0
            ? `In ${classDisplayName}, there are ${inactiveStudents.length} inactive/unapproved students.`
            : `All ${classStudents.length} students in ${classDisplayName} are active and approved.`;

        setResult({
          type: 'roster',
          title: `Inactive / Unapproved Students (${classDisplayName})`,
          summaryText: summary,
          className: matchedClass.class_name,
          sectionName: matchedClass.section_name ?? undefined,
          stats: [
            { label: 'Inactive', value: inactiveStudents.length, color: '#EF4444' },
            {
              label: 'Active',
              value: classStudents.length - inactiveStudents.length,
              color: '#10B981',
            },
          ],
          studentsList: inactiveStudents.map((s) => ({
            name: s.name,
            rollNo: s.roll_no,
            srn: s.srn,
            status: 'Inactive',
          })),
        });
        speakText(summary);
        setProcessing(false);
        return;
      }

      // 14. DEFAULT ROSTER QUERY
      const summary = `There are ${classStudents.length} registered students in ${classDisplayName}.`;

      setResult({
        type: 'roster',
        title: `Student Roster (${classDisplayName})`,
        summaryText: summary,
        className: matchedClass.class_name,
        sectionName: matchedClass.section_name ?? undefined,
        stats: [{ label: 'Total Students', value: classStudents.length, color: '#3B82F6' }],
        studentsList: classStudents.map((s) => ({
          name: s.name,
          rollNo: s.roll_no,
          srn: s.srn,
        })),
      });
      speakText(summary);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Could not process query.';
      setResult({
        type: 'error',
        title: 'Error',
        summaryText: errorMsg,
        className: 'Assigned Class',
        errorMessage: errorMsg,
      });
    } finally {
      setProcessing(false);
    }
  }

  const SAMPLE_PROMPTS = [
    'Which students have not paid the fees?',
    'How much total fee is paid in LKG A?',
    'Details of Roll No 12',
    'What subjects are in LKG Section A?',
    'Show syllabus for English',
    'Show school notices',
    'Upcoming school events',
    'How many students are present in LKG Section A today?',
    'Is Rahul Kumar present today?',
    'Who is absent today in LKG Section A?',
    'How many boys and girls in LKG Section A?',
    'Show pending leave requests for LKG A',
    'What homework is assigned today?',
    'Summary of all my assigned classes',
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {/* Top Title Bar */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.micHeaderIcon, { backgroundColor: theme.tint + '20' }]}>
                <Ionicons name="mic" size={18} color={theme.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                  Teacher Voice AI
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  Ask queries for your classes
                </ThemedText>
              </View>
            </View>
            <Pressable onPress={handleClose} hitSlop={10} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Assigned Classes Badge Bar */}
          <View style={[styles.classesScopeBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <ThemedText type="small" style={{ color: '#10B981', fontSize: 11 }}>
              Scope: Authorized for{' '}
              {teacherClasses
                .map((c) => `${c.class_name}${c.section_name ? `-${c.section_name}` : ''}`)
                .join(', ') || 'Your Classes'}{' '}
              only
            </ThemedText>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Voice Microphone Controller Box */}
            <View style={[styles.voiceBox, { backgroundColor: theme.backgroundElement }]}>
              <Pressable
                onPress={handleMicPress}
                style={[
                  styles.micCircleButton,
                  listening && styles.micCircleButtonActive,
                  { backgroundColor: listening ? '#EF4444' : theme.tint },
                ]}
              >
                <Ionicons name={listening ? 'mic-sharp' : 'mic'} size={32} color="#FFFFFF" />
              </Pressable>

              <ThemedText type="smallBold" style={[styles.micStatusText, { color: theme.text }]}>
                {listening ? 'Listening… Speak your query now' : 'Tap Microphone to Speak'}
              </ThemedText>

              {transcript ? (
                <View style={[styles.transcriptBox, { borderColor: theme.tint, backgroundColor: theme.surface }]}>
                  <ThemedText type="small" style={{ color: theme.tint, fontStyle: 'italic' }}>
                    "{transcript}"
                  </ThemedText>
                </View>
              ) : null}
            </View>

            {/* Input & Search Trigger Bar */}
            <View style={styles.inputRow}>
              <TextInput
                value={queryText}
                onChangeText={setQueryText}
                placeholder="Or type e.g. Roll 12 details / Unpaid fees"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
                onSubmitEditing={() => processVoiceQuery(queryText)}
              />
              <Pressable
                onPress={() => processVoiceQuery(queryText)}
                disabled={processing || !queryText.trim()}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: theme.tint,
                    opacity: processing || !queryText.trim() ? 0.5 : 1,
                  },
                ]}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            {/* Sample Prompt Chips */}
            <View style={styles.promptChipsWrap}>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 6 }}>
                Try speaking:
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {SAMPLE_PROMPTS.map((prompt, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        setQueryText(prompt);
                        processVoiceQuery(prompt);
                      }}
                      style={[styles.chip, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}
                    >
                      <Ionicons name="sparkles" size={12} color={theme.tint} />
                      <ThemedText type="small" style={{ fontSize: 11, color: theme.text }}>
                        {prompt}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Query Result Section */}
            {processing ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={theme.tint} />
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
                  Querying database for your assigned classes…
                </ThemedText>
              </View>
            ) : result ? (
              <Card
                style={[
                  styles.resultCard,
                  result.type === 'error' && { borderColor: '#EF4444', borderWidth: 1.5 },
                ]}
              >
                <View style={styles.resultHeader}>
                  <ThemedText type="subtitle" style={{ fontSize: 15, flex: 1, paddingRight: 4, color: theme.text }}>
                    {result.title}
                  </ThemedText>
                  
                  <View style={styles.audioControlsRow}>
                    {/* Sound Enable / Mute Toggle Button */}
                    <Pressable
                      onPress={() => {
                        if (soundEnabled) {
                          stopSpeech();
                          setSoundEnabled(false);
                        } else {
                          setSoundEnabled(true);
                        }
                      }}
                      style={[
                        styles.soundPillBtn,
                        { backgroundColor: soundEnabled ? theme.tint + '20' : theme.backgroundElement },
                      ]}
                    >
                      <Ionicons
                        name={soundEnabled ? 'volume-high' : 'volume-mute'}
                        size={14}
                        color={soundEnabled ? theme.tint : theme.textSecondary}
                      />
                      <ThemedText
                        type="smallBold"
                        style={{ color: soundEnabled ? theme.tint : theme.textSecondary, fontSize: 11 }}
                      >
                        {soundEnabled ? 'Sound ON' : 'Muted'}
                      </ThemedText>
                    </Pressable>

                    {/* Play Voice Button */}
                    <Pressable
                      onPress={() => {
                        if (!soundEnabled) {
                          setSoundEnabled(true);
                        }
                        speakText(result.summaryText);
                      }}
                      style={[
                        styles.playVoiceBtn,
                        { backgroundColor: soundEnabled ? theme.tint : theme.backgroundElement },
                      ]}
                    >
                      <Ionicons name="play-circle" size={16} color={soundEnabled ? '#FFFFFF' : theme.textSecondary} />
                      <ThemedText
                        type="smallBold"
                        style={{ color: soundEnabled ? '#FFFFFF' : theme.textSecondary, fontSize: 11 }}
                      >
                        Play Voice
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                <ThemedText type="default" style={[styles.summaryText, { color: theme.text }]}>
                  {result.summaryText}
                </ThemedText>

                {/* Stat Badges Row */}
                {result.stats && result.stats.length > 0 ? (
                  <View style={styles.statsGrid}>
                    {result.stats.map((s, idx) => (
                      <View key={idx} style={[styles.statBox, { backgroundColor: s.color + '22' }]}>
                        <ThemedText type="title" style={{ color: s.color, fontSize: 18 }}>
                          {s.value}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.text, fontSize: 11 }}>
                          {s.label}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Individual Student Profile Card */}
                {result.studentDetail ? (
                  <View
                    style={[
                      styles.detailBox,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color={theme.tint} />
                      <ThemedText type="smallBold" style={{ flex: 1, color: theme.text }}>
                        Name: {result.studentDetail.name}
                      </ThemedText>
                    </View>
                    {result.studentDetail.rollNo ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="id-card-outline" size={16} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.text }}>Roll No: {result.studentDetail.rollNo}</ThemedText>
                      </View>
                    ) : null}
                    {result.studentDetail.srn ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="barcode-outline" size={16} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.text }}>SRN: {result.studentDetail.srn}</ThemedText>
                      </View>
                    ) : null}
                    {result.studentDetail.fatherName ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.text }}>
                          Father's Name: {result.studentDetail.fatherName}
                        </ThemedText>
                      </View>
                    ) : null}
                    {result.studentDetail.motherName ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.text }}>
                          Mother's Name: {result.studentDetail.motherName}
                        </ThemedText>
                      </View>
                    ) : null}
                    {result.studentDetail.phone ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.text }}>Contact: {result.studentDetail.phone}</ThemedText>
                      </View>
                    ) : null}
                    {result.studentDetail.status ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="information-circle-outline" size={16} color={theme.tint} />
                        <ThemedText type="smallBold" style={{ color: theme.tint }}>
                          Status: {result.studentDetail.status}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* All Classes Overview Breakdown */}
                {result.classList && result.classList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Assigned Class Sections ({result.classList.length}):
                    </ThemedText>
                    {result.classList.map((c, i) => (
                      <View key={i} style={[styles.listItemRow, { borderBottomColor: theme.border }]}>
                        <Ionicons name="easel-outline" size={16} color={theme.tint} />
                        <ThemedText type="smallBold" style={{ flex: 1, marginLeft: 6, color: theme.text }}>
                          {c.className} {c.sectionName ? `(Sec ${c.sectionName})` : ''}
                        </ThemedText>
                        <View style={[styles.statusBadge, { backgroundColor: theme.tint + '20' }]}>
                          <ThemedText type="small" style={{ color: theme.tint, fontSize: 11 }}>
                            {c.studentCount} Students
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Subjects List */}
                {result.subjectsList && result.subjectsList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Subjects ({result.subjectsList.length}):
                    </ThemedText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {result.subjectsList.map((subj, i) => (
                        <View
                          key={i}
                          style={[
                            styles.subjectChip,
                            { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 },
                          ]}
                        >
                          <Ionicons name="book" size={14} color={theme.tint} />
                          <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 12 }}>
                            {subj.name} {subj.code ? `(${subj.code})` : ''}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Syllabus List */}
                {result.syllabusList && result.syllabusList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Syllabus Chapters ({result.syllabusList.length}):
                    </ThemedText>
                    {result.syllabusList.map((ch, i) => (
                      <View
                        key={i}
                        style={[
                          styles.listItemRow,
                          { flexDirection: 'column', alignItems: 'flex-start', borderBottomColor: theme.border, gap: 2 },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                          <ThemedText type="smallBold" style={{ flex: 1, color: theme.text }}>
                            Ch {ch.chapterNumber}: {ch.title}
                          </ThemedText>
                          <View style={[styles.statusBadge, { backgroundColor: ch.completed ? '#D1FAE5' : '#FEF3C7' }]}>
                            <ThemedText type="small" style={{ color: ch.completed ? '#065F46' : '#92400E', fontSize: 10 }}>
                              {ch.completed ? 'Completed' : 'Pending'}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                          Subject: {ch.subject} {ch.topics && ch.topics.length > 0 ? `| Topics: ${ch.topics.join(', ')}` : ''}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Notices List */}
                {result.noticeList && result.noticeList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Published Notices ({result.noticeList.length}):
                    </ThemedText>
                    {result.noticeList.map((n, i) => (
                      <View
                        key={i}
                        style={[
                          styles.listItemRow,
                          { flexDirection: 'column', alignItems: 'flex-start', borderBottomColor: theme.border, gap: 2 },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="megaphone-outline" size={14} color={theme.tint} />
                          <ThemedText type="smallBold" style={{ flex: 1, color: theme.text }}>
                            {n.title}
                          </ThemedText>
                          {n.date ? (
                            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 10 }}>
                              {n.date}
                            </ThemedText>
                          ) : null}
                        </View>
                        {n.body ? (
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={{ fontSize: 11, marginLeft: 20 }}>
                            {n.body}
                          </ThemedText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Events List */}
                {result.eventList && result.eventList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      School Events ({result.eventList.length}):
                    </ThemedText>
                    {result.eventList.map((ev, i) => (
                      <View
                        key={i}
                        style={[
                          styles.listItemRow,
                          { flexDirection: 'column', alignItems: 'flex-start', borderBottomColor: theme.border, gap: 2 },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="calendar-outline" size={14} color="#7C3AED" />
                          <ThemedText type="smallBold" style={{ flex: 1, color: theme.text }}>
                            {ev.title}
                          </ThemedText>
                          {ev.date ? (
                            <View style={[styles.statusBadge, { backgroundColor: '#7C3AED20' }]}>
                              <ThemedText type="small" style={{ color: '#7C3AED', fontSize: 10 }}>
                                {ev.date}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                        {ev.description ? (
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={{ fontSize: 11, marginLeft: 20 }}>
                            {ev.description}
                          </ThemedText>
                        ) : null}
                        {ev.location ? (
                          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 10, marginLeft: 20, fontStyle: 'italic' }}>
                            Location: {ev.location}
                          </ThemedText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Leave Applications List */}
                {result.leaveList && result.leaveList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Leave Applications ({result.leaveList.length}):
                    </ThemedText>
                    {result.leaveList.map((l, i) => (
                      <View
                        key={i}
                        style={[
                          styles.listItemRow,
                          { flexDirection: 'column', alignItems: 'flex-start', gap: 2, borderBottomColor: theme.border },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            width: '100%',
                            justifyContent: 'space-between',
                          }}
                        >
                          <ThemedText type="smallBold" style={{ color: theme.text }}>
                            {i + 1}. {l.studentName}
                          </ThemedText>
                          <ThemedText
                            type="small"
                            style={{
                              color: l.status === 'PENDING' ? '#F59E0B' : '#10B981',
                              fontSize: 10,
                            }}
                          >
                            {l.status}
                          </ThemedText>
                        </View>
                        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                          Dates: {l.dates} {l.reason ? `| Reason: ${l.reason}` : ''}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Fee Invoices List */}
                {result.feeList && result.feeList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Fee Invoices ({result.feeList.length}):
                    </ThemedText>
                    {result.feeList.map((f, i) => (
                      <View key={i} style={[styles.listItemRow, { borderBottomColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" style={{ color: theme.text }}>
                            {i + 1}. {f.studentName}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                            {f.title}
                          </ThemedText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <ThemedText type="smallBold" style={{ color: f.status === 'PAID' ? '#10B981' : '#EF4444' }}>
                            {f.amount}
                          </ThemedText>
                          <View style={[styles.statusBadge, { backgroundColor: f.status === 'PAID' ? '#D1FAE5' : '#FEE2E2' }]}>
                            <ThemedText type="small" style={{ color: f.status === 'PAID' ? '#065F46' : '#991B1B', fontSize: 9 }}>
                              {f.status}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Homework List */}
                {result.homeworkList && result.homeworkList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Assigned Homework ({result.homeworkList.length}):
                    </ThemedText>
                    {result.homeworkList.map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.listItemRow,
                          { flexDirection: 'column', alignItems: 'flex-start', borderBottomColor: theme.border },
                        ]}
                      >
                        <ThemedText type="smallBold" style={{ color: theme.tint }}>
                          {h.subject}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {h.title}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Student Roster / Attendance List */}
                {result.studentsList && result.studentsList.length > 0 ? (
                  <View style={styles.listWrap}>
                    <ThemedText type="smallBold" style={{ marginBottom: 6, color: theme.text }}>
                      Student List ({result.studentsList.length}):
                    </ThemedText>
                    {result.studentsList.slice(0, 15).map((st, i) => (
                      <View key={i} style={[styles.listItemRow, { borderBottomColor: theme.border }]}>
                        <ThemedText type="smallBold" style={{ flex: 1, color: theme.text }}>
                          {i + 1}. {st.name} {st.rollNo ? `(Roll: ${st.rollNo})` : ''}
                        </ThemedText>
                        {st.status ? (
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  st.status === 'Present'
                                    ? '#D1FAE5'
                                    : st.status === 'Absent'
                                    ? '#FEE2E2'
                                    : '#FEF3C7',
                              },
                            ]}
                          >
                            <ThemedText
                              type="small"
                              style={{
                                color:
                                  st.status === 'Present'
                                    ? '#065F46'
                                    : st.status === 'Absent'
                                    ? '#991B1B'
                                    : '#92400E',
                                fontSize: 10,
                              }}
                            >
                              {st.status}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            ) : null}
          </ScrollView>

          {/* Hidden Speech Bridge for Native Android/iOS */}
          {Platform.OS !== 'web' ? (
            <View style={{ height: 0, width: 0, opacity: 0, overflow: 'hidden' }}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                onMessage={handleWebViewMessage}
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body>
                      <script>
                        let rec = null;
                        let finalTranscriptText = '';
                        function startRec() {
                          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                          if (!SpeechRecognition) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: 'not_supported' }));
                            return;
                          }
                          if (rec) {
                            try { rec.abort(); } catch(e){}
                          }
                          rec = new SpeechRecognition();
                          rec.continuous = false;
                          rec.interimResults = true;
                          rec.lang = 'en-US';
                          finalTranscriptText = '';

                          rec.onstart = function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'start' }));
                          };
                          rec.onresult = function(e) {
                            let curr = '';
                            for (let i = e.resultIndex; i < e.results.length; i++) {
                              curr += e.results[i][0].transcript;
                            }
                            if (curr) {
                              finalTranscriptText = curr;
                              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', transcript: curr }));
                            }
                          };
                          rec.onerror = function(e) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.error }));
                          };
                          rec.onend = function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'end', finalTranscript: finalTranscriptText }));
                          };
                          rec.start();
                        }
                        function stopRec() {
                          if (rec) {
                            try { rec.stop(); } catch(e){}
                          }
                        }
                      </script>
                    </body>
                    </html>
                  `,
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    minHeight: '65%',
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  micHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
  },
  classesScopeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginBottom: Spacing.three,
  },
  bodyScroll: {
    flex: 1,
  },
  voiceBox: {
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
  },
  micCircleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  micCircleButtonActive: {
    transform: [{ scale: 1.08 }],
  },
  micStatusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  transcriptBox: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    maxWidth: '90%',
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soundPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  playVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
  },
  submitBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChipsWrap: {
    marginBottom: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  resultCard: {
    padding: Spacing.three,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statBox: {
    flex: 1,
    minWidth: '22%',
    padding: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  listWrap: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  detailBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: 8,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
