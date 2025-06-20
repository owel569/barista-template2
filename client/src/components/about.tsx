export default function About() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-coffee-dark mb-6">
              Notre Histoire
            </h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Depuis 2010, le Barista Café vous accueille dans un cadre chaleureux où se mélangent 
              l'arôme du café fraîchement torréfié et l'art de la gastronomie française.
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Nos baristas passionnés sélectionnent les meilleurs grains du monde pour vous offrir 
              une expérience unique à chaque visite.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-coffee-accent mb-2">50+</div>
                <div className="text-gray-600">Variétés de café</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-coffee-accent mb-2">13</div>
                <div className="text-gray-600">Années d'expérience</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img 
              src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500" 
              alt="Barista préparant un café" 
              className="rounded-lg shadow-lg w-full h-64 object-cover"
            />
            <img 
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300" 
              alt="Intérieur du café" 
              className="rounded-lg shadow-lg w-full h-40 object-cover"
            />
            <img 
              src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300" 
              alt="Grains de café" 
              className="rounded-lg shadow-lg w-full h-40 object-cover"
            />
            <img 
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500" 
              alt="Tasse de café artistique" 
              className="rounded-lg shadow-lg w-full h-64 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
