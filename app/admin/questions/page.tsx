import {
  MessageCircleQuestion,
  MessageSquareText,
  CircleHelp,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import QuestionCatalog from "@/components/admin/QuestionCatalog";

export default async function AdminQuestionsPage() {
  // RBAC: questions.view
  const admin = await requireAdminPermission("questions.view");

  const canAnswer = admin.permissions.includes("questions.answer");
  const canDelete = admin.permissions.includes("questions.delete");

  const questions = await prisma.productQuestion.findMany({
    include: {
      user: true,
      product: true,
      answers: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const answeredQuestions = questions.filter(
    (question) => question.answers.length > 0,
  ).length;
  const unansweredQuestions = questions.length - answeredQuestions;
  const totalAnswers = questions.reduce(
    (total, question) => total + question.answers.length,
    0,
  );
  const uniqueAskers = new Set(questions.map((question) => question.userId))
    .size;

  const serializedQuestions = questions.map((question) => ({
    id: question.id,
    question: question.question,
    createdAt: question.createdAt.toISOString(),
    answerCount: question.answers.length,
    user: {
      id: question.user.id,
      name: question.user.name,
      email: question.user.email,
    },
    product: {
      id: question.product.id,
      name: question.product.name,
      slug: question.product.slug,
    },
  }));

  const stats = [
    {
      label: "Total Questions",
      value: questions.length,
      icon: MessageCircleQuestion,
      gradient: "from-[#F2ECFC] via-[#F6F1FD] to-[#FBF8FF]",
      border: "border-[#E9DDF9]",
      iconBg: "bg-[#E7D9F7]",
      iconColor: "text-[#8464B5]",
    },
    {
      label: "Total Answers",
      value: totalAnswers,
      icon: MessageSquareText,
      gradient: "from-[#E9F7F0] via-[#F0FBF5] to-[#F9FEFB]",
      border: "border-[#D9EFE2]",
      iconBg: "bg-[#D7F0E1]",
      iconColor: "text-[#38936A]",
    },
    {
      label: "Unanswered",
      value: unansweredQuestions,
      icon: CircleHelp,
      gradient: "from-[#FFF2E6] via-[#FFF7EF] to-[#FFFCF8]",
      border: "border-[#F5E3D0]",
      iconBg: "bg-[#FFE7CD]",
      iconColor: "text-[#D18A43]",
    },
    {
      label: "Askers",
      value: uniqueAskers,
      icon: Users,
      gradient: "from-[#EAF3FF] via-[#F1F7FF] to-[#FAFCFF]",
      border: "border-[#DAE8FA]",
      iconBg: "bg-[#DAE9FC]",
      iconColor: "text-[#5A8AC6]",
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
          Questions
        </h1>
        <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
          Manage product questions and answers submitted by your users.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Question statistics">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-[146px] rounded-[21px] border bg-gradient-to-br ${stat.gradient} ${stat.border} p-5 shadow-[0_6px_20px_rgba(39,28,59,0.035)]`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="pt-0.5 text-[13px] font-medium text-[#6F6A78]">
                  {stat.label}
                </p>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${stat.iconBg} ${stat.iconColor}`}>
                  <Icon size={19} strokeWidth={1.9} />
                </div>
              </div>
              <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.045em] text-[#24212D]">
                {stat.value.toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </section>

      <QuestionCatalog
        questions={serializedQuestions}
        canAnswer={canAnswer}
        canDelete={canDelete}
      />
    </div>
  );
}
