import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-black">
      <h1 className="text-4xl font-bold mb-8">スリザーリンク</h1>
      <div className="text-lg mb-8 max-w-2xl text-center leading-relaxed space-y-4">
        <p>
          スリザーリンクは、点と点をつないで1つの輪を作るペンシルパズルです。
        </p>
        <p>
          数字は、そのマスを囲む4つの辺のうち、線が引かれる辺の数を表しています。<br />
          すべての数字の条件を満たすように線を引いて、途切れたり交差したりしない1つの輪を作ってください。
        </p>
      </div>
      <Link 
        href="/problem" 
        className="px-8 py-4 bg-blue-600 text-white rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors"
      >
        プレーする
      </Link>
    </main>
  );
}
