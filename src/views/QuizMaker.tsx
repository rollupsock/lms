import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
}

export default function QuizMaker() {
  const { t } = useTranslation();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: '', type: 'multiple-choice' }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: '', type: 'multiple-choice' }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title || !courseId || questions.some(q => !q.question)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'quizzes'), {
        title,
        description,
        courseId,
        questions,
        teacherId: user?.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Quiz created successfully');
      navigate('/courses');
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Quiz Maker</h1>
          <p className="text-stone-500">Create interactive assessments for your students.</p>
        </div>
        <Button onClick={handleSave} className="bg-stone-900 hover:bg-stone-800 text-white gap-2">
          <Save size={18} />
          Save Quiz
        </Button>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif">Quiz Details</CardTitle>
          <CardDescription>Basic information about this assessment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input 
                id="title" 
                placeholder="e.g., Mid-term Assessment" 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course ID</Label>
              <Input 
                id="course" 
                placeholder="Enter course ID" 
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description (Optional)</Label>
            <Textarea 
              id="desc" 
              placeholder="Provide instructions for students..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold text-stone-800 flex items-center gap-2">
            <HelpCircle className="text-stone-400" />
            Questions ({questions.length})
          </h2>
          <Button variant="outline" onClick={addQuestion} className="gap-2 border-stone-200">
            <Plus size={18} />
            Add Question
          </Button>
        </div>

        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="border-stone-200 shadow-sm relative group">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeQuestion(qIndex)}
            >
              <Trash2 size={18} />
            </Button>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Question {qIndex + 1}</Label>
                  <Input 
                    placeholder="Enter your question here..." 
                    value={q.question}
                    onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={q.type} 
                    onValueChange={(v: any) => updateQuestion(qIndex, 'type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="true-false">True/False</SelectItem>
                      <SelectItem value="short-answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {q.type === 'multiple-choice' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                        {String.fromCharCode(65 + oIndex)}
                      </div>
                      <Input 
                        placeholder={`Option ${oIndex + 1}`} 
                        value={opt}
                        onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'true-false' && (
                <div className="flex gap-4">
                  <Button 
                    variant={q.correctAnswer === 'True' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateQuestion(qIndex, 'correctAnswer', 'True')}
                  >
                    True
                  </Button>
                  <Button 
                    variant={q.correctAnswer === 'False' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateQuestion(qIndex, 'correctAnswer', 'False')}
                  >
                    False
                  </Button>
                </div>
              )}

              {q.type !== 'true-false' && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input 
                    placeholder={q.type === 'multiple-choice' ? 'e.g., Option A' : 'Enter the correct answer...'} 
                    value={q.correctAnswer}
                    onChange={e => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
