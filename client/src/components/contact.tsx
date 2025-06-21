import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Phone, Clock, Send, Facebook, Instagram, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ContactFormData = z.infer<typeof insertContactMessageSchema>;

export default function Contact() {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(insertContactMessageSchema)
  });

  const contactMutation = useMutation({
    mutationFn: (data: ContactFormData) => 
      apiRequest("POST", "/api/contact", data),
    onSuccess: () => {
      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <section id="contact" className="py-20 bg-coffee-dark text-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Nous Contacter
          </h2>
          <p className="text-lg text-coffee-secondary max-w-2xl mx-auto">
            Une question, une suggestion ou envie de privatiser notre espace ? Contactez-nous
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">
              <Mail className="inline mr-2 text-coffee-accent" />
              Envoyez-nous un message
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-coffee-secondary font-semibold mb-2">
                    Prénom *
                  </Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-coffee-secondary font-semibold mb-2">
                    Nom *
                  </Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="block text-coffee-secondary font-semibold mb-2">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="subject" className="block text-coffee-secondary font-semibold mb-2">
                  Sujet *
                </Label>
                <Select onValueChange={(value) => setValue("subject", value)}>
                  <SelectTrigger className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent">
                    <SelectValue placeholder="Choisir un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservation">Question sur une réservation</SelectItem>
                    <SelectItem value="menu">Question sur le menu</SelectItem>
                    <SelectItem value="privatisation">Privatisation d'espace</SelectItem>
                    <SelectItem value="feedback">Avis et suggestions</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="message" className="block text-coffee-secondary font-semibold mb-2">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  rows={6}
                  placeholder="Votre message..."
                  className="bg-coffee-cream text-coffee-dark focus:border-coffee-accent"
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={contactMutation.isPending}
                className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-4 px-6 rounded-lg transition duration-300 transform hover:scale-105"
              >
                <Send className="mr-2 h-5 w-5" />
                {contactMutation.isPending ? "Envoi..." : "Envoyer le message"}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold mb-6">
                <MapPin className="inline mr-2 text-coffee-accent" />
                Nos Coordonnées
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Adresse</h4>
                    <p>123 Rue du Café<br />75001 Paris, France</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Téléphone</h4>
                    <p>01 23 45 67 89</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Email</h4>
                    <p>contact@barista-cafe.fr</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="text-coffee-accent text-xl mr-4 mt-1 h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-coffee-secondary mb-1">Horaires d'ouverture</h4>
                    <div className="space-y-1">
                      <p>Lundi - Vendredi: 8h00 - 21h00</p>
                      <p>Samedi - Dimanche: 9h00 - 22h00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold text-coffee-secondary mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                <a href="#" className="bg-coffee-accent hover:bg-coffee-secondary text-white p-3 rounded-full transition duration-300">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-coffee-accent hover:bg-coffee-secondary text-white p-3 rounded-full transition duration-300">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-coffee-accent hover:bg-coffee-secondary text-white p-3 rounded-full transition duration-300">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-coffee-cream rounded-lg p-4">
              <div className="bg-gray-300 h-48 rounded flex items-center justify-center text-coffee-dark">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-semibold">Carte Google Maps</p>
                  <p className="text-sm text-gray-600">123 Rue du Café, Paris</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
