export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="text-8xl mb-6">🎾</div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">NYC Tennis Club</h1>
        <div className="h-1 bg-green-500 w-32 mx-auto mb-6"></div>
        <p className="text-2xl text-gray-600 mb-8">Website Successfully Deployed!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-green-800">Domain Working</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl mb-2">🚀</div>
            <p className="font-semibold text-blue-800">Vercel Deployed</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-3xl mb-2">🎯</div>
            <p className="font-semibold text-purple-800">Ready to Build</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-700 text-lg">
            <strong>Great news!</strong> The deployment infrastructure is working perfectly. 
            Ready to restore the full tennis website with maps, court finder, and all features.
          </p>
        </div>
      </div>
    </div>
  );
}
