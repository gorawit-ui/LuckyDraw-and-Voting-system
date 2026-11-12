import Link from 'next/link';

type Props = {
  emoji: string;
  title: string;
  description: string;
  phase: string;
  prototype?: string;
  checklist?: string[];
};

// หน้า placeholder ระหว่างพัฒนา — ชี้ไปต้นแบบเดิมที่เล่นได้แล้ว
export default function ComingSoon({ emoji, title, description, phase, prototype, checklist = [] }: Props) {
  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card-pop p-4 p-md-5 text-center">
            <div style={{ fontSize: '4.5rem', filter: 'drop-shadow(3px 3px 0 var(--ink))' }}>{emoji}</div>
            <span className="pixel-badge my-3">{phase}</span>
            <h1 className="fw-bolder">{title}</h1>
            <p className="lead">{description}</p>
            {checklist.length > 0 && (
              <ul className="list-unstyled text-start d-inline-block mt-2">
                {checklist.map((c) => (
                  <li key={c} className="mb-1"><i className="bi bi-square me-2" />{c}</li>
                ))}
              </ul>
            )}
            <div className="d-flex flex-wrap gap-3 justify-content-center mt-4">
              {prototype && (
                <a href={prototype} target="_blank" rel="noopener" className="btn btn-pop btn-lg">
                  <i className="bi bi-joystick me-2" />ลองเล่นต้นแบบ
                </a>
              )}
              <Link href="/" className="btn btn-pop btn-pop-cream btn-lg">
                <i className="bi bi-arrow-left me-2" />กลับหน้าแรก
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
